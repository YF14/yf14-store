const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const logger = require('../config/logger');
const stripeLog = logger.createScopedLogger('stripe');

// Create payment intent
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { amount, currency = 'usd', orderId } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency,
      metadata: { orderId: orderId?.toString(), userId: req.user.id },
    });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    stripeLog.warn({
      message: 'Stripe webhook signature failed',
      requestId: req.requestId,
      err: err.message,
    });
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const { metadata, id } = event.data.object;
      if (metadata.orderId) {
        await Order.findByIdAndUpdate(metadata.orderId, {
          status: 'confirmed',
          stripePaymentIntentId: id,
          $push: { statusHistory: { status: 'confirmed', note: 'Payment confirmed via Stripe' } }
        });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const { metadata } = event.data.object;
      if (metadata.orderId) {
        await Order.findByIdAndUpdate(metadata.orderId, {
          $push: { statusHistory: { status: 'pending', note: 'Stripe payment failed' } }
        });
      }
      break;
    }
  }

  stripeLog.info({
    message: 'Stripe webhook handled',
    type: event.type,
    eventId: event.id,
    requestId: req.requestId,
  });
  res.json({ received: true });
});

module.exports = router;
