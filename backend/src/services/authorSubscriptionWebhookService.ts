import Stripe from 'stripe';
import pool from '../config/database';
import { sendCustomEmail } from './emailService';

/**
 * Handle customer.subscription.created event for author subscriptions
 * Fired when a new author subscription is created
 */
const handleAuthorSubscriptionCreated = async (subscription: Stripe.Subscription): Promise<void> => {
  console.log(`[Author Subscription Webhook] Subscription created: ${subscription.id}`);

  const authorId = subscription.metadata.author_id;
  const subscriberId = subscription.metadata.subscriber_id;
  const tier = subscription.metadata.tier as 'monthly' | 'annual';
  const isPremiumSubscriber = subscription.metadata.is_premium_subscriber === 'true';
  const discountApplied = parseInt(subscription.metadata.discount_applied || '0');

  if (!authorId || !subscriberId || !tier) {
    console.error('Missing required metadata in subscription:', subscription.metadata);
    return;
  }

  // Get subscription amount
  const amount = subscription.items.data[0]?.price.unit_amount || 0;

  const trialStart = (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null;
  const trialEnd = (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null;

  await pool.query('BEGIN');

  try {
    // Create author subscription record
    await pool.query(
      `INSERT INTO author_subscriptions (
        author_id,
        subscriber_id,
        stripe_subscription_id,
        stripe_customer_id,
        status,
        tier,
        amount,
        currency,
        current_period_start,
        current_period_end,
        trial_start,
        trial_end,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (author_id, subscriber_id) DO UPDATE SET
        stripe_subscription_id = $3,
        stripe_customer_id = $4,
        status = $5,
        tier = $6,
        amount = $7,
        current_period_start = $9,
        current_period_end = $10,
        trial_start = $11,
        trial_end = $12,
        updated_at = NOW()`,
      [
        parseInt(authorId),
        parseInt(subscriberId),
        subscription.id,
        subscription.customer as string,
        subscription.status,
        tier,
        amount,
        'eur',
        new Date((subscription as any).current_period_start * 1000),
        new Date((subscription as any).current_period_end * 1000),
        trialStart,
        trialEnd,
      ]
    );

    // Create payment record
    await pool.query(
      `INSERT INTO payments (
        user_id,
        amount,
        currency,
        payment_type,
        status,
        stripe_payment_intent_id,
        created_at
      )
      SELECT $1, $2, $3, $4, $5, $6, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM payments WHERE stripe_payment_intent_id = $6
      )`,
      [
        parseInt(subscriberId),
        amount,
        'eur',
        'author_subscription',
        'completed',
        subscription.latest_invoice as string,
      ]
    );

    // Update author's cached metrics
    await updateAuthorMetrics(parseInt(authorId));

    await pool.query('COMMIT');

    // Get author and subscriber details for email
    const usersResult = await pool.query(
      `SELECT
        (SELECT email FROM users WHERE id = $1) as author_email,
        (SELECT username FROM users WHERE id = $1) as author_name,
        (SELECT email FROM users WHERE id = $2) as subscriber_email,
        (SELECT username FROM users WHERE id = $2) as subscriber_name`,
      [parseInt(authorId), parseInt(subscriberId)]
    );

    if (usersResult.rows.length > 0) {
      const { author_email, author_name, subscriber_email, subscriber_name } = usersResult.rows[0];

      // Send welcome email to subscriber
      sendAuthorSubscriptionWelcomeEmail(
        subscriber_email,
        subscriber_name,
        author_name,
        tier
      ).catch((err) => console.error('Failed to send welcome email:', err));

      // Notify author of new subscriber
      sendNewSubscriberNotification(
        author_email,
        author_name,
        subscriber_name
      ).catch((err) => console.error('Failed to send author notification:', err));
    }
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Handle customer.subscription.updated event for author subscriptions
 * Fired when subscription status or details change
 */
const handleAuthorSubscriptionUpdated = async (subscription: Stripe.Subscription): Promise<void> => {
  console.log(`[Author Subscription Webhook] Subscription updated: ${subscription.id}`);

  const authorId = subscription.metadata.author_id;
  const tier = subscription.metadata.tier as 'monthly' | 'annual';

  if (!authorId) {
    console.error('Missing author_id in subscription metadata');
    return;
  }

  await pool.query('BEGIN');

  try {
    // Update subscription record
    await pool.query(
      `UPDATE author_subscriptions
       SET status = $1,
           tier = $2,
           current_period_start = $3,
           current_period_end = $4,
           cancel_at_period_end = $5,
           updated_at = NOW()
       WHERE stripe_subscription_id = $6`,
      [
        subscription.status,
        tier,
        new Date((subscription as any).current_period_start * 1000),
        new Date((subscription as any).current_period_end * 1000),
        subscription.cancel_at_period_end,
        subscription.id,
      ]
    );

    // Update author's cached metrics
    await updateAuthorMetrics(parseInt(authorId));

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Handle customer.subscription.deleted event for author subscriptions
 * Fired when subscription is canceled or ends
 */
const handleAuthorSubscriptionDeleted = async (subscription: Stripe.Subscription): Promise<void> => {
  console.log(`[Author Subscription Webhook] Subscription deleted: ${subscription.id}`);

  const authorId = subscription.metadata.author_id;
  const subscriberId = subscription.metadata.subscriber_id;

  if (!authorId || !subscriberId) {
    console.error('Missing required metadata in subscription');
    return;
  }

  await pool.query('BEGIN');

  try {
    // Update subscription record
    await pool.query(
      `UPDATE author_subscriptions
       SET status = 'canceled',
           canceled_at = NOW(),
           updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    // Update author's cached metrics
    await updateAuthorMetrics(parseInt(authorId));

    await pool.query('COMMIT');

    // Get user details for notification
    const usersResult = await pool.query(
      `SELECT
        (SELECT username FROM users WHERE id = $1) as author_name,
        (SELECT email FROM users WHERE id = $2) as subscriber_email,
        (SELECT username FROM users WHERE id = $2) as subscriber_name`,
      [parseInt(authorId), parseInt(subscriberId)]
    );

    if (usersResult.rows.length > 0) {
      const { author_name, subscriber_email, subscriber_name } = usersResult.rows[0];

      // Send cancellation email to subscriber
      sendAuthorSubscriptionCanceledEmail(
        subscriber_email,
        subscriber_name,
        author_name
      ).catch((err) => console.error('Failed to send cancellation email:', err));
    }
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Handle invoice.payment_succeeded event for author subscriptions
 * Fired when subscription payment succeeds
 */
const handleAuthorInvoicePaymentSucceeded = async (invoice: Stripe.Invoice): Promise<void> => {
  console.log(`[Author Subscription Webhook] Invoice payment succeeded: ${invoice.id}`);

  const invoiceSub = (invoice as any).subscription;
  if (!invoiceSub) {
    return; // Not a subscription invoice
  }

  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub.id;

  // Get subscription details
  const subResult = await pool.query(
    `SELECT id, author_id, subscriber_id, tier, amount
     FROM author_subscriptions
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  if (subResult.rows.length === 0) {
    console.log('[Author Subscription Webhook] Subscription not found in database');
    return;
  }

  const { id, author_id, subscriber_id, tier, amount } = subResult.rows[0];

  await pool.query('BEGIN');

  try {
    // Update subscription status to active
    await pool.query(
      `UPDATE author_subscriptions
       SET status = 'active',
           updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );

    // Check if user is premium subscriber for discount tracking
    const userResult = await pool.query(
      'SELECT subscription_tier FROM users WHERE id = $1',
      [subscriber_id]
    );
    const isPremiumSubscriber = userResult.rows[0]?.subscription_tier === 'premium';

    // Calculate discount amount if applicable
    const discountAmount = 0; // Could be calculated from invoice.discount if needed

    // Record revenue
    const revenueType = invoice.billing_reason === 'subscription_create'
      ? 'initial_subscription'
      : 'renewal';

    await pool.query(
      `INSERT INTO author_subscription_revenue (
        author_id,
        subscription_id,
        amount,
        currency,
        tier,
        is_premium_subscriber,
        discount_amount,
        stripe_invoice_id,
        stripe_charge_id,
        revenue_type,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        author_id,
        id,
        amount,
        'eur',
        tier,
        isPremiumSubscriber,
        discountAmount,
        invoice.id,
        (invoice as any).charge as string,
        revenueType,
      ]
    );

    // Update author's cached metrics (MRR, subscriber count)
    await updateAuthorMetrics(author_id);

    await pool.query('COMMIT');

    // Send payment receipt email
    const userEmailResult = await pool.query(
      'SELECT email, username FROM users WHERE id = $1',
      [subscriber_id]
    );
    if (userEmailResult.rows.length > 0) {
      const { email, username } = userEmailResult.rows[0];
      sendPaymentReceiptEmail(
        email,
        username,
        amount,
        invoice.hosted_invoice_url || ''
      ).catch((err) => console.error('Failed to send receipt email:', err));
    }
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Handle invoice.payment_failed event for author subscriptions
 * Fired when subscription payment fails
 */
const handleAuthorInvoicePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  console.log(`[Author Subscription Webhook] Invoice payment failed: ${invoice.id}`);

  const invoiceSub = (invoice as any).subscription;
  if (!invoiceSub) {
    return; // Not a subscription invoice
  }

  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub.id;

  // Update subscription status to past_due
  await pool.query(
    `UPDATE author_subscriptions
     SET status = 'past_due',
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  // Get subscriber email for notification
  const userResult = await pool.query(
    `SELECT u.email, u.username
     FROM users u
     JOIN author_subscriptions s ON s.subscriber_id = u.id
     WHERE s.stripe_subscription_id = $1`,
    [subscriptionId]
  );

  if (userResult.rows.length > 0) {
    const { email, username } = userResult.rows[0];
    sendAuthorSubscriptionPaymentFailedEmail(
      email,
      username,
      invoice.hosted_invoice_url || ''
    ).catch((err) => console.error('Failed to send payment failed email:', err));
  }
};

/**
 * Update author's cached metrics (subscriber count and MRR)
 */
async function updateAuthorMetrics(authorId: number): Promise<void> {
  // Calculate subscriber count
  const countResult = await pool.query(
    `SELECT COUNT(*) as count
     FROM author_subscriptions
     WHERE author_id = $1 AND status = 'active'`,
    [authorId]
  );

  const subscriberCount = parseInt(countResult.rows[0].count) || 0;

  // Calculate MRR (Monthly Recurring Revenue)
  const mrrResult = await pool.query(
    `SELECT SUM(
      CASE
        WHEN tier = 'monthly' THEN amount
        WHEN tier = 'annual' THEN ROUND(amount / 12)
      END
    ) as mrr
    FROM author_subscriptions
    WHERE author_id = $1 AND status = 'active'`,
    [authorId]
  );

  const mrr = parseInt(mrrResult.rows[0].mrr) || 0;

  // Update cached fields in users table
  await pool.query(
    `UPDATE users
     SET paid_subscribers_count = $1,
         monthly_recurring_revenue = $2
     WHERE id = $3`,
    [subscriberCount, mrr, authorId]
  );
}

/**
 * Main webhook handler for author subscription events
 */
export const handleAuthorSubscriptionWebhook = async (event: Stripe.Event): Promise<void> => {
  console.log(`[Author Subscription Webhook] Processing event: ${event.type}`);

  // Check if this is an author subscription event
  const subscription = event.data.object as Stripe.Subscription | Stripe.Invoice;
  let metadata;

  if ('subscription' in subscription) {
    // This is an invoice - get subscription metadata
    const invoiceSub = (subscription as any).subscription;
    if (!invoiceSub) {
      return; // Not a subscription invoice
    }
  } else {
    // This is a subscription - check metadata
    metadata = (subscription as Stripe.Subscription).metadata;
    if (!metadata?.author_id) {
      return; // Not an author subscription
    }
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleAuthorSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleAuthorSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleAuthorSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleAuthorInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleAuthorInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Author Subscription Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`[Author Subscription Webhook] Error processing ${event.type}:`, error);
    throw error;
  }
};

// Email helper functions
async function sendAuthorSubscriptionWelcomeEmail(
  email: string,
  subscriberName: string,
  authorName: string,
  tier: string
): Promise<void> {
  await sendCustomEmail({
    to: email,
    subject: `Welcome to ${authorName}'s Subscriber Community!`,
    html: `
      <h1>Welcome, ${subscriberName}!</h1>
      <p>Thank you for subscribing to ${authorName}'s content. You now have full access to all their paid blogs!</p>
      <p>Your subscription: <strong>${tier === 'monthly' ? 'Monthly' : 'Annual'}</strong></p>
      <p><a href="${process.env.FRONTEND_URL}/author-subscriptions">Manage your subscriptions</a></p>
      <p>Happy reading!</p>
    `,
  });
}

async function sendNewSubscriberNotification(
  authorEmail: string,
  authorName: string,
  subscriberName: string
): Promise<void> {
  await sendCustomEmail({
    to: authorEmail,
    subject: 'New Subscriber to Your Content!',
    html: `
      <h1>Great News, ${authorName}!</h1>
      <p><strong>${subscriberName}</strong> just subscribed to your content!</p>
      <p><a href="${process.env.FRONTEND_URL}/author-dashboard">View your dashboard</a></p>
    `,
  });
}

async function sendAuthorSubscriptionCanceledEmail(
  email: string,
  subscriberName: string,
  authorName: string
): Promise<void> {
  await sendCustomEmail({
    to: email,
    subject: `Subscription to ${authorName} canceled`,
    html: `
      <h1>Subscription Canceled</h1>
      <p>Hi ${subscriberName},</p>
      <p>Your subscription to ${authorName}'s content has been canceled. You'll continue to have access until the end of your current billing period.</p>
      <p>You can reactivate anytime from your <a href="${process.env.FRONTEND_URL}/author-subscriptions">subscription settings</a>.</p>
    `,
  });
}

async function sendPaymentReceiptEmail(
  email: string,
  username: string,
  amount: number,
  invoiceUrl: string
): Promise<void> {
  const amountFormatted = (amount / 100).toFixed(2);
  await sendCustomEmail({
    to: email,
    subject: 'Payment Receipt - Author Subscription',
    html: `
      <h1>Payment Receipt</h1>
      <p>Hi ${username},</p>
      <p>Thank you for your payment of €${amountFormatted} for your author subscription.</p>
      <p><a href="${invoiceUrl}">View invoice</a></p>
      <p>Questions? Contact our support team.</p>
    `,
  });
}

async function sendAuthorSubscriptionPaymentFailedEmail(
  email: string,
  username: string,
  invoiceUrl: string
): Promise<void> {
  await sendCustomEmail({
    to: email,
    subject: 'Payment Failed - Author Subscription',
    html: `
      <h1>Payment Failed</h1>
      <p>Hi ${username},</p>
      <p>We couldn't process your payment for your author subscription. Please update your payment method to continue accessing paid content.</p>
      <p><a href="${invoiceUrl}">View and pay invoice</a></p>
      <p>Or <a href="${process.env.FRONTEND_URL}/author-subscriptions">manage your subscriptions</a>.</p>
    `,
  });
}
