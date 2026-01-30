import Stripe from 'stripe';
import { stripe, stripeConfig } from '../config/stripe';

export interface CreateCheckoutSessionParams {
  mode: 'payment' | 'subscription';
  lineItems: {
    name: string;
    description?: string;
    amount: number; // in cents
    quantity: number;
  }[];
  metadata: Record<string, string>;
  customerId?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    mode: params.mode,
    payment_method_types: ['card'],
    line_items: params.lineItems.map((item) => ({
      price_data: {
        currency: stripeConfig.currency,
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    })),
    metadata: params.metadata,
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.customerEmail,
    success_url: params.successUrl || stripeConfig.successUrl,
    cancel_url: params.cancelUrl || stripeConfig.cancelUrl,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
};

export const getCheckoutSession = async (
  sessionId: string
): Promise<Stripe.Checkout.Session> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'customer'],
  });
};

export const createRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // undefined means full refund
    reason: reason || 'requested_by_customer',
  });
};

export const constructWebhookEvent = (
  payload: Buffer,
  signature: string
): Stripe.Event => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    stripeConfig.webhookSecret
  );
};
