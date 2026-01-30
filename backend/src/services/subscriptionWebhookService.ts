import Stripe from 'stripe';
import pool from '../config/database';
import { sendCustomEmail } from './emailService';
import type { SubscriptionTier } from '../config/stripeProducts';

/**
 * Handle customer.subscription.created event
 * Fired when a new subscription is created
 */
const handleSubscriptionCreated = async (subscription: Stripe.Subscription): Promise<void> => {
  console.log(`[Subscription Webhook] Subscription created: ${subscription.id}`);

  const userId = subscription.metadata.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const tier: SubscriptionTier = 'premium';
  const trialStart = (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null;
  const trialEnd = (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null;

  await pool.query('BEGIN');

  try {
    // Update or insert subscription record
    await pool.query(
      `INSERT INTO subscriptions (
        user_id, tier, status, stripe_subscription_id, stripe_customer_id,
        current_period_start, current_period_end, trial_start, trial_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        tier = $2,
        status = $3,
        stripe_subscription_id = $4,
        stripe_customer_id = $5,
        current_period_start = $6,
        current_period_end = $7,
        trial_start = $8,
        trial_end = $9,
        updated_at = NOW()`,
      [
        parseInt(userId),
        tier,
        subscription.status,
        subscription.id,
        subscription.customer as string,
        new Date((subscription as any).current_period_start * 1000),
        new Date((subscription as any).current_period_end * 1000),
        trialStart,
        trialEnd,
      ]
    );

    // Update cached fields in users table
    await pool.query(
      `UPDATE users
       SET subscription_tier = $1,
           subscription_status = $2,
           trial_ends_at = $3
       WHERE id = $4`,
      [tier, subscription.status, trialEnd, parseInt(userId)]
    );

    await pool.query('COMMIT');

    // Get user email for notification
    const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [parseInt(userId)]);
    if (userResult.rows.length > 0) {
      const { email, name } = userResult.rows[0];
      // Send welcome email (async, don't await)
      sendSubscriptionWelcomeEmail(email, name, tier).catch((err) =>
        console.error('Failed to send welcome email:', err)
      );
    }
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Handle customer.subscription.updated event
 * Fired when subscription status or details change
 */
const handleSubscriptionUpdated = async (subscription: Stripe.Subscription): Promise<void> => {
  console.log(`[Subscription Webhook] Subscription updated: ${subscription.id}`);

  const userId = subscription.metadata.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Determine tier based on subscription status
  const tier: SubscriptionTier =
    subscription.status === 'active' || subscription.status === 'trialing' ? 'premium' : 'free';

  await pool.query('BEGIN');

  try {
    // Update subscription record
    await pool.query(
      `UPDATE subscriptions
       SET tier = $1,
           status = $2,
           current_period_start = $3,
           current_period_end = $4,
           cancel_at_period_end = $5,
           updated_at = NOW()
       WHERE stripe_subscription_id = $6`,
      [
        tier,
        subscription.status,
        new Date((subscription as any).current_period_start * 1000),
        new Date((subscription as any).current_period_end * 1000),
        subscription.cancel_at_period_end,
        subscription.id,
      ]
    );

    // Update cached fields in users table
    await pool.query(
      `UPDATE users
       SET subscription_tier = $1,
           subscription_status = $2
       WHERE id = $3`,
      [tier, subscription.status, parseInt(userId)]
    );

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Handle customer.subscription.deleted event
 * Fired when subscription is canceled or ends
 */
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription): Promise<void> => {
  console.log(`[Subscription Webhook] Subscription deleted: ${subscription.id}`);

  const userId = subscription.metadata.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  await pool.query('BEGIN');

  try {
    // Update subscription record
    await pool.query(
      `UPDATE subscriptions
       SET tier = 'free',
           status = 'canceled',
           canceled_at = NOW(),
           updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    // Downgrade user to free tier
    await pool.query(
      `UPDATE users
       SET subscription_tier = 'free',
           subscription_status = 'canceled'
       WHERE id = $1`,
      [parseInt(userId)]
    );

    await pool.query('COMMIT');

    // Get user email for notification
    const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [parseInt(userId)]);
    if (userResult.rows.length > 0) {
      const { email, name } = userResult.rows[0];
      // Send cancellation email (async, don't await)
      sendSubscriptionCanceledEmail(email, name).catch((err) =>
        console.error('Failed to send cancellation email:', err)
      );
    }
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Handle invoice.payment_succeeded event
 * Fired when subscription payment succeeds
 */
const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice): Promise<void> => {
  console.log(`[Subscription Webhook] Invoice payment succeeded: ${invoice.id}`);

  const invoiceSub = (invoice as any).subscription;
  if (!invoiceSub) {
    return; // Not a subscription invoice
  }

  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub.id;

  // Update subscription status to active
  await pool.query(
    `UPDATE subscriptions
     SET status = 'active',
         cancel_at_period_end = FALSE,
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  // Update user status
  await pool.query(
    `UPDATE users u
     SET subscription_status = 'active'
     FROM subscriptions s
     WHERE s.stripe_subscription_id = $1 AND u.id = s.user_id`,
    [subscriptionId]
  );
};

/**
 * Handle invoice.payment_failed event
 * Fired when subscription payment fails
 */
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  console.log(`[Subscription Webhook] Invoice payment failed: ${invoice.id}`);

  const invoiceSub = (invoice as any).subscription;
  if (!invoiceSub) {
    return; // Not a subscription invoice
  }

  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub.id;

  // Update subscription status to past_due
  await pool.query(
    `UPDATE subscriptions
     SET status = 'past_due',
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  // Update user status
  await pool.query(
    `UPDATE users u
     SET subscription_status = 'past_due'
     FROM subscriptions s
     WHERE s.stripe_subscription_id = $1 AND u.id = s.user_id`,
    [subscriptionId]
  );

  // Get user email for notification
  const userResult = await pool.query(
    `SELECT u.email, u.name
     FROM users u
     JOIN subscriptions s ON s.user_id = u.id
     WHERE s.stripe_subscription_id = $1`,
    [subscriptionId]
  );

  if (userResult.rows.length > 0) {
    const { email, name } = userResult.rows[0];
    // Send payment failed email (async, don't await)
    sendPaymentFailedEmail(email, name, invoice.hosted_invoice_url || '').catch((err) =>
      console.error('Failed to send payment failed email:', err)
    );
  }
};

/**
 * Main webhook handler for subscription events
 */
export const handleSubscriptionWebhook = async (event: Stripe.Event): Promise<void> => {
  console.log(`[Subscription Webhook] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Subscription Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`[Subscription Webhook] Error processing ${event.type}:`, error);
    throw error;
  }
};

// Email helper functions (will be added to emailTemplates.ts)
async function sendSubscriptionWelcomeEmail(email: string, name: string, tier: string): Promise<void> {
  await sendCustomEmail({
    to: email,
    subject: 'Welcome to ChessFam Premium!',
    html: `
      <h1>Welcome to Premium, ${name}!</h1>
      <p>Thank you for subscribing to ChessFam Premium. You now have access to:</p>
      <ul>
        <li>Unlimited game creation</li>
        <li>Priority support</li>
        <li>Advanced statistics</li>
        <li>Ad-free experience</li>
        <li>Premium badge</li>
      </ul>
      <p>Visit your <a href="${process.env.FRONTEND_URL}/account/subscription">subscription settings</a> to manage your plan.</p>
      <p>Happy chess playing!</p>
    `,
  });
}

async function sendSubscriptionCanceledEmail(email: string, name: string): Promise<void> {
  await sendCustomEmail({
    to: email,
    subject: 'Your ChessFam Premium subscription was canceled',
    html: `
      <h1>Subscription Canceled</h1>
      <p>Hi ${name},</p>
      <p>Your ChessFam Premium subscription has been canceled. You'll continue to have access to premium features until the end of your current billing period.</p>
      <p>You can reactivate your subscription at any time from your <a href="${process.env.FRONTEND_URL}/account/subscription">subscription settings</a>.</p>
      <p>We're sorry to see you go!</p>
    `,
  });
}

async function sendPaymentFailedEmail(email: string, name: string, invoiceUrl: string): Promise<void> {
  await sendCustomEmail({
    to: email,
    subject: 'Payment failed for ChessFam Premium',
    html: `
      <h1>Payment Failed</h1>
      <p>Hi ${name},</p>
      <p>We couldn't process your payment for ChessFam Premium. Please update your payment method to continue enjoying premium features.</p>
      <p><a href="${invoiceUrl}">View and pay invoice</a></p>
      <p>Or manage your payment methods in your <a href="${process.env.FRONTEND_URL}/account/subscription">subscription settings</a>.</p>
      <p>If you have any questions, please contact our support team.</p>
    `,
  });
}
