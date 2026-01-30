import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.warn('Warning: STRIPE_SECRET_KEY not set. Payment functionality will be disabled.');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

export const stripeConfig = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'usd',
  // Success/cancel URLs for checkout
  successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancelled`,
};
