/**
 * Service Stripe : encapsule l'usage du SDK pour qu'on puisse le mocker en test.
 */
const env = require('../config/env');

let stripe = null;
function getStripe() {
  if (!stripe) {
    if (!env.stripe.secretKey) {
      console.warn('[stripe] STRIPE_SECRET_KEY missing — payments will fail');
    }
    stripe = require('stripe')(env.stripe.secretKey);
  }
  return stripe;
}

async function createPaymentIntent({ amountCents, orderId, userEmail }) {
  return getStripe().paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    receipt_email: userEmail,
    metadata: { orderId },
    automatic_payment_methods: { enabled: true },
  });
}

async function constructWebhookEvent(rawBody, signature) {
  return getStripe().webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
}

async function refundPayment(paymentIntentId, amountCents) {
  return getStripe().refunds.create({ payment_intent: paymentIntentId, amount: amountCents });
}

module.exports = { createPaymentIntent, constructWebhookEvent, refundPayment };
