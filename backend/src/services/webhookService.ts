import Stripe from 'stripe';
import { handlePaymentSuccess, handlePaymentFailed } from './paymentService';
import { handleSubscriptionWebhook } from './subscriptionWebhookService';
import { handleAuthorSubscriptionWebhook } from './authorSubscriptionWebhookService';

export const handleStripeWebhook = async (event: Stripe.Event): Promise<void> => {
  console.log(`[Webhook] Processing event: ${event.type}`);

  // Handle subscription events - check for author subscriptions first
  if (
    event.type.startsWith('customer.subscription.') ||
    event.type.startsWith('invoice.')
  ) {
    // Try author subscription webhook first (it will check metadata)
    await handleAuthorSubscriptionWebhook(event);

    // Then handle platform subscription webhook
    await handleSubscriptionWebhook(event);
    return;
  }

  // Handle one-time payment events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === 'paid') {
        await handlePaymentSuccess(
          session.id,
          session.payment_intent as string
        );
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handlePaymentFailed(session.id);
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Webhook] PaymentIntent ${paymentIntent.id} succeeded`);
      // This is handled by checkout.session.completed for our use case
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Webhook] PaymentIntent ${paymentIntent.id} failed`);
      // This is handled by checkout.session.expired for our use case
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      console.log(`[Webhook] Charge ${charge.id} refunded`);
      // Refund is already tracked when we call createRefund
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }
};
