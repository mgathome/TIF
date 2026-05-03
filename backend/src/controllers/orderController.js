const { z } = require('zod');
const { query, withTransaction } = require('../config/database');
const { NotFound, Forbidden, BadRequest, Conflict } = require('../utils/errors');
const stripeService = require('../services/stripe');

// === Schemas ===
const createOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  type: z.enum(['pickup', 'delivery']).default('pickup'),
  scheduledFor: z.string().datetime(), // ISO 8601
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    notes: z.string().max(500).optional(),
  })).min(1),
  deliveryAddress: z.string().max(500).optional(),
  deliveryNotes: z.string().max(500).optional(),
  customerNotes: z.string().max(500).optional(),
  promoCode: z.string().max(40).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled']),
});

// === Helpers ===
function rowToOrder(o, items = []) {
  return {
    id: o.id,
    orderNumber: o.order_number,
    userId: o.user_id,
    restaurantId: o.restaurant_id,
    status: o.status,
    type: o.type,
    scheduledFor: o.scheduled_for,
    deliveryAddress: o.delivery_address,
    deliveryNotes: o.delivery_notes,
    customerNotes: o.customer_notes,
    subtotalCents: o.subtotal_cents,
    deliveryFeeCents: o.delivery_fee_cents,
    promoDiscountCents: o.promo_discount_cents,
    totalCents: o.total_cents,
    promoCodeApplied: o.promo_code_applied,
    createdAt: o.created_at,
    items: items.map(i => ({
      id: i.id,
      menuItemId: i.menu_item_id,
      name: i.name_snapshot,
      priceCents: i.price_cents_snapshot,
      quantity: i.quantity,
      notes: i.notes,
      lineTotalCents: i.line_total_cents,
    })),
  };
}

async function generateOrderNumber(client) {
  const { rows } = await client.query("SELECT 'TIF-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('order_number_seq')::text, 6, '0') AS num");
  return rows[0].num;
}

// === POST /api/orders ===
async function create(req, res) {
  const b = req.body;

  const result = await withTransaction(async (client) => {
    // 1. Verrou du restaurant + items (évite race conditions sur stock/menu changeant)
    const { rows: restRows } = await client.query(
      'SELECT id, offers_pickup, offers_delivery, delivery_fee_cents, min_order_cents, is_published FROM restaurants WHERE id = $1 FOR SHARE',
      [b.restaurantId]
    );
    if (restRows.length === 0) throw new NotFound('Restaurant not found');
    const r = restRows[0];
    if (!r.is_published) throw new BadRequest('Restaurant not available');
    if (b.type === 'pickup' && !r.offers_pickup) throw new BadRequest('Pickup not offered');
    if (b.type === 'delivery' && !r.offers_delivery) throw new BadRequest('Delivery not offered');

    // 2. Récupère les menu_items demandés (snapshot)
    const ids = b.items.map(i => i.menuItemId);
    const { rows: itemsRows } = await client.query(
      `SELECT id, name, price_cents, restaurant_id, is_available
       FROM menu_items WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    // 3. Validation : tous appartiennent au restaurant + dispo
    const map = new Map(itemsRows.map(i => [i.id, i]));
    let subtotal = 0;
    const lines = [];
    for (const reqItem of b.items) {
      const found = map.get(reqItem.menuItemId);
      if (!found) throw new BadRequest(`Menu item ${reqItem.menuItemId} not found`);
      if (found.restaurant_id !== b.restaurantId) throw new BadRequest('Item does not belong to restaurant');
      if (!found.is_available) throw new BadRequest(`Item "${found.name}" not available`);
      subtotal += found.price_cents * reqItem.quantity;
      lines.push({ menuItem: found, quantity: reqItem.quantity, notes: reqItem.notes || null });
    }

    if (subtotal < r.min_order_cents) {
      throw new BadRequest(`Minimum order is ${r.min_order_cents} cents`);
    }

    // 4. Code promo (optionnel)
    let promoDiscount = 0;
    let promoApplied = null;
    if (b.promoCode) {
      const { rows: pr } = await client.query(
        `SELECT * FROM promo_codes
         WHERE code = $1 AND is_active = TRUE
           AND (valid_until IS NULL OR valid_until > NOW())
           AND (max_uses IS NULL OR uses_count < max_uses)
           AND (restaurant_id IS NULL OR restaurant_id = $2)`,
        [b.promoCode, b.restaurantId]
      );
      if (pr.length === 0) throw new BadRequest('Invalid promo code');
      const p = pr[0];
      if (subtotal < p.min_order_cents) throw new BadRequest('Order below promo minimum');
      promoDiscount = p.discount_type === 'percent'
        ? Math.floor(subtotal * p.discount_value / 100)
        : Math.min(p.discount_value, subtotal);
      promoApplied = p.code;
      await client.query('UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1', [p.id]);
    }

    const deliveryFee = b.type === 'delivery' ? r.delivery_fee_cents : 0;
    const total = subtotal + deliveryFee - promoDiscount;
    const orderNumber = await generateOrderNumber(client);

    // 5. Insert order
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (
        order_number, user_id, restaurant_id, status, type, scheduled_for,
        delivery_address, delivery_notes, customer_notes,
        subtotal_cents, delivery_fee_cents, promo_discount_cents, total_cents, promo_code_applied
      ) VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        orderNumber, req.user.id, b.restaurantId, b.type, b.scheduledFor,
        b.deliveryAddress || null, b.deliveryNotes || null, b.customerNotes || null,
        subtotal, deliveryFee, promoDiscount, total, promoApplied,
      ]
    );
    const order = orderRows[0];

    // 6. Insert order_items
    const insertedItems = [];
    for (const line of lines) {
      const { rows } = await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name_snapshot, price_cents_snapshot, quantity, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [order.id, line.menuItem.id, line.menuItem.name, line.menuItem.price_cents, line.quantity, line.notes]
      );
      insertedItems.push(rows[0]);
    }

    return { order, items: insertedItems };
  });

  // 7. Crée le PaymentIntent Stripe (hors tx, peut échouer sans rollback)
  const paymentIntent = await stripeService.createPaymentIntent({
    amountCents: result.order.total_cents,
    orderId: result.order.id,
    userEmail: req.user.email,
  });

  // 8. Persiste le payment lié
  await query(
    `INSERT INTO payments (order_id, stripe_payment_intent_id, amount_cents, currency, status)
     VALUES ($1, $2, $3, 'EUR', 'pending')`,
    [result.order.id, paymentIntent.id, result.order.total_cents]
  );

  res.status(201).json({
    order: rowToOrder(result.order, result.items),
    payment: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id },
  });
}

// === GET /api/orders/me  (clients : mes commandes) ===
async function listMine(req, res) {
  const { rows: orders } = await query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  const ids = orders.map(o => o.id);
  let itemsByOrder = {};
  if (ids.length > 0) {
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = ANY($1::uuid[])', [ids]);
    itemsByOrder = items.reduce((acc, i) => {
      (acc[i.order_id] = acc[i.order_id] || []).push(i); return acc;
    }, {});
  }
  res.json({ orders: orders.map(o => rowToOrder(o, itemsByOrder[o.id] || [])) });
}

// === GET /api/orders/restaurant/:restaurantId  (resto : commandes reçues) ===
async function listForRestaurant(req, res) {
  const { rows: own } = await query('SELECT owner_id FROM restaurants WHERE id = $1', [req.params.restaurantId]);
  if (own.length === 0) throw new NotFound();
  if (own[0].owner_id !== req.user.id && req.user.role !== 'admin') throw new Forbidden();

  const status = req.query.status;
  const params = [req.params.restaurantId];
  let where = 'restaurant_id = $1 AND status NOT IN (\'pending\')';
  if (status) { params.push(status); where += ` AND status = $${params.length}`; }

  const { rows: orders } = await query(
    `SELECT * FROM orders WHERE ${where} ORDER BY scheduled_for ASC LIMIT 100`,
    params
  );
  const ids = orders.map(o => o.id);
  let itemsByOrder = {};
  if (ids.length > 0) {
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = ANY($1::uuid[])', [ids]);
    itemsByOrder = items.reduce((acc, i) => {
      (acc[i.order_id] = acc[i.order_id] || []).push(i); return acc;
    }, {});
  }
  res.json({ orders: orders.map(o => rowToOrder(o, itemsByOrder[o.id] || [])) });
}

// === GET /api/orders/:id ===
async function getOne(req, res) {
  const { rows } = await query(
    `SELECT o.*, r.owner_id AS r_owner FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) throw new NotFound();
  const o = rows[0];
  // ACL : client propriétaire OU owner restaurant OU admin
  if (o.user_id !== req.user.id && o.r_owner !== req.user.id && req.user.role !== 'admin') {
    throw new Forbidden();
  }
  const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
  res.json({ order: rowToOrder(o, items) });
}

// === PATCH /api/orders/:id/status  (resto only) ===
// Pickup : paid -> preparing -> ready -> completed
// Delivery : paid -> preparing -> ready -> out_for_delivery -> completed
const STATUS_TRANSITIONS = {
  paid:              ['preparing', 'cancelled'],
  preparing:         ['ready', 'cancelled'],
  ready:             ['out_for_delivery', 'completed'],
  out_for_delivery:  ['completed'],
  completed:         [],
  cancelled:         [],
  pending:           ['cancelled'],
  refunded:          [],
};

async function updateStatus(req, res) {
  const { rows } = await query(
    `SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) throw new NotFound();
  const o = rows[0];
  if (o.owner_id !== req.user.id && req.user.role !== 'admin') throw new Forbidden();

  const allowed = STATUS_TRANSITIONS[o.status] || [];
  if (!allowed.includes(req.body.status)) {
    throw new Conflict(`Cannot transition from ${o.status} to ${req.body.status}`);
  }

  // Cast explicite vers l'enum order_status (sinon pg ne sait pas inferer le type)
  const { rows: updated } = await query(
    `UPDATE orders
     SET status = $1::order_status,
         cancelled_at = CASE WHEN $1::order_status = 'cancelled' THEN NOW() ELSE cancelled_at END
     WHERE id = $2
     RETURNING *`,
    [req.body.status, req.params.id]
  );

  // Notif cote client (data en jsonb avec cast explicite)
  await query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1, 'order_status_changed', $2, $3, $4::jsonb)`,
    [
      o.user_id,
      `Commande ${o.order_number} : ${req.body.status}`,
      `Votre commande est maintenant "${req.body.status}".`,
      JSON.stringify({ orderId: o.id, status: req.body.status }),
    ]
  );

  res.json({ order: rowToOrder(updated[0]) });
}

module.exports = {
  create, listMine, listForRestaurant, getOne, updateStatus,
  createOrderSchema, updateStatusSchema,
};
