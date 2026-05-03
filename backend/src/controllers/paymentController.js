const { query } = require('../config/database');
const stripeService = require('../services/stripe');
const { NotFound, Forbidden, BadRequest } = require('../utils/errors');

// === GET /api/payments/order/:orderId  (poll status) ===
async function getForOrder(req, res) {
  const { rows } = await query(
    `SELECT p.*, o.user_id, r.owner_id
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE p.order_id = $1
     ORDER BY p.created_at DESC LIMIT 1`,
    [req.params.orderId]
  );
  if (rows.length === 0) throw new NotFound();
  const p = rows[0];
  if (p.user_id !== req.user.id && p.owner_id !== req.user.id && req.user.role !== 'admin') {
    throw new Forbidden();
  }
  res.json({
    payment: {
      id: p.id,
      orderId: p.order_id,
      status: p.status,
      amountCents: p.amount_cents,
      currency: p.currency,
      stripePaymentIntentId: p.stripe_payment_intent_id,
    },
  });
}

// === POST /api/payments/webhook  (Stripe -> serveur) ===
//
// IMPORTANT : monté avec express.raw() AVANT json() dans server.js.
async function stripeWebhookHandler(req, res) {
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).send('Missing signature');

  let event;
  try {
    event = await stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('[stripe-webhook] signature failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        await query(
          `UPDATE payments SET status = 'succeeded', stripe_charge_id = $2 WHERE stripe_payment_intent_id = $1`,
          [intent.id, intent.latest_charge || null]
        );
        // L'order passe de pending -> paid (le restaurant prendra la suite)
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await query(
            `UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending'`,
            [orderId]
          );
          // Notif resto
          const { rows } = await query(
            `SELECT r.owner_id, o.order_number FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = $1`,
            [orderId]
          );
          if (rows.length > 0) {
            await query(
              `INSERT INTO notifications (user_id, type, title, body, data)
               VALUES ($1, 'order_paid', $2, $3, $4)`,
              [
                rows[0].owner_id,
                `Nouvelle commande payée : ${rows[0].order_number}`,
                'Une commande vient d\'être payée et attend votre confirmation.',
                JSON.stringify({ orderId }),
              ]
            );
          }
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        await query(
          `UPDATE payments SET status = 'failed', failure_reason = $2 WHERE stripe_payment_intent_id = $1`,
          [intent.id, intent.last_payment_error?.message || 'unknown']
        );
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        await query(
          `UPDATE payments SET status = 'refunded', refunded_amount_cents = $2 WHERE stripe_charge_id = $1`,
          [charge.id, charge.amount_refunded]
        );
        break;
      }
      default:
        // ignore les events non utilisés pour l'instant
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] handler error', err);
    res.status(500).send('Webhook handler error');
  }
}

module.exports = { getForOrder, stripeWebhookHandler };
