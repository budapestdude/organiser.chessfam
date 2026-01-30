import { stripe, stripeConfig } from '../config/stripe';
import pool from '../config/database';
import { SUBSCRIPTION_LIMITS, getQuotaLimit, hasUnlimitedQuota, type SubscriptionTier } from '../config/stripeProducts';

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  requiresUpgrade: boolean;
  tier: SubscriptionTier;
  inTrial: boolean;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: string;
  inTrial: boolean;
  trialEndsAt: Date | null;
  quotaUsed: number;
  quotaLimit: number;
  quotaRemaining: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

/**
 * Create a Stripe checkout session for subscription
 */
export const createSubscriptionCheckout = async (
  userId: number,
  priceId: string,
  email: string
): Promise<{ checkoutUrl: string; sessionId: string }> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get or create Stripe customer
  const userResult = await pool.query(
    'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
    [userId]
  );

  let customerId: string | undefined;

  if (userResult.rows.length > 0 && userResult.rows[0].stripe_customer_id) {
    customerId = userResult.rows[0].stripe_customer_id;
  } else {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id: userId.toString() },
    });
    customerId = customer.id;

    // Save customer ID
    await pool.query(
      `UPDATE subscriptions SET stripe_customer_id = $1, updated_at = NOW() WHERE user_id = $2`,
      [customerId, userId]
    );
  }

  // Create checkout session with 14-day trial
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        user_id: userId.toString(),
      },
    },
    success_url: `${process.env.FRONTEND_URL}/account/subscription?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/premium?canceled=true`,
    metadata: {
      user_id: userId.toString(),
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

/**
 * Cancel subscription at period end
 */
export const cancelSubscription = async (userId: number): Promise<void> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const result = await pool.query(
    'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0 || !result.rows[0].stripe_subscription_id) {
    throw new Error('No active subscription found');
  }

  const stripeSubscriptionId = result.rows[0].stripe_subscription_id;

  // Cancel at period end in Stripe
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // Update database
  await pool.query(
    `UPDATE subscriptions
     SET cancel_at_period_end = TRUE,
         canceled_at = NOW(),
         updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
};

/**
 * Reactivate a canceled subscription (before period end)
 */
export const reactivateSubscription = async (userId: number): Promise<void> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const result = await pool.query(
    'SELECT stripe_subscription_id, current_period_end FROM subscriptions WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0 || !result.rows[0].stripe_subscription_id) {
    throw new Error('No subscription found');
  }

  const { stripe_subscription_id, current_period_end } = result.rows[0];

  // Check if still in current period
  if (new Date() > new Date(current_period_end)) {
    throw new Error('Subscription period has already ended');
  }

  // Reactivate in Stripe
  await stripe.subscriptions.update(stripe_subscription_id, {
    cancel_at_period_end: false,
  });

  // Update database
  await pool.query(
    `UPDATE subscriptions
     SET cancel_at_period_end = FALSE,
         canceled_at = NULL,
         updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
};

/**
 * Check if user can create a game and increment quota
 */
export const checkAndIncrementGameQuota = async (
  userId: number
): Promise<QuotaCheckResult> => {
  // Get user's subscription and trial status
  const result = await pool.query(
    `SELECT u.subscription_tier, u.trial_ends_at, u.games_created_this_month, s.status
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const { subscription_tier, trial_ends_at, games_created_this_month, status } = result.rows[0];
  const tier = subscription_tier as SubscriptionTier;
  const currentQuota = games_created_this_month || 0;
  const quotaLimit = getQuotaLimit(tier);

  // Check if user is in trial
  const inTrial = trial_ends_at && new Date(trial_ends_at) > new Date();

  // Trial users get unlimited quota
  if (inTrial) {
    // Increment counter but don't enforce limit
    await pool.query(
      `UPDATE users
       SET games_created_this_month = games_created_this_month + 1
       WHERE id = $1`,
      [userId]
    );

    // Log quota usage
    await pool.query(
      `INSERT INTO subscription_quota_usage (user_id, action_type, quota_used)
       VALUES ($1, 'game_created', 1)`,
      [userId]
    );

    return {
      allowed: true,
      remaining: -1, // unlimited
      limit: -1,
      requiresUpgrade: false,
      tier,
      inTrial: true,
    };
  }

  // Premium users get unlimited quota
  if (hasUnlimitedQuota(tier)) {
    // Increment counter (for stats tracking)
    await pool.query(
      `UPDATE users
       SET games_created_this_month = games_created_this_month + 1
       WHERE id = $1`,
      [userId]
    );

    // Log quota usage
    await pool.query(
      `INSERT INTO subscription_quota_usage (user_id, action_type, quota_used)
       VALUES ($1, 'game_created', 1)`,
      [userId]
    );

    return {
      allowed: true,
      remaining: -1, // unlimited
      limit: -1,
      requiresUpgrade: false,
      tier,
      inTrial: false,
    };
  }

  // Free tier - check quota
  if (currentQuota >= quotaLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: quotaLimit,
      requiresUpgrade: true,
      tier,
      inTrial: false,
    };
  }

  // Allowed - increment quota
  await pool.query(
    `UPDATE users
     SET games_created_this_month = games_created_this_month + 1
     WHERE id = $1`,
    [userId]
  );

  // Log quota usage
  await pool.query(
    `INSERT INTO subscription_quota_usage (user_id, action_type, quota_used)
     VALUES ($1, 'game_created', 1)`,
    [userId]
  );

  const remaining = quotaLimit - (currentQuota + 1);

  return {
    allowed: true,
    remaining,
    limit: quotaLimit,
    requiresUpgrade: false,
    tier,
    inTrial: false,
  };
};

/**
 * Get user's subscription status
 */
export const getSubscriptionStatus = async (
  userId: number
): Promise<SubscriptionStatus> => {
  // Check if subscriptions table exists
  const tableCheck = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
    )`
  );

  const subscriptionsTableExists = tableCheck.rows[0].exists;

  let result;
  if (subscriptionsTableExists) {
    result = await pool.query(
      `SELECT u.subscription_tier, u.trial_ends_at, u.games_created_this_month,
              s.status, s.current_period_end, s.cancel_at_period_end, s.stripe_subscription_id
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
  } else {
    // Fallback if subscriptions table doesn't exist yet
    result = await pool.query(
      `SELECT 'free' as subscription_tier, NULL as trial_ends_at, 0 as games_created_this_month,
              'active' as status, NULL as current_period_end, false as cancel_at_period_end, NULL as stripe_subscription_id
       FROM users
       WHERE id = $1`,
      [userId]
    );
  }

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const row = result.rows[0];
  const tier = row.subscription_tier as SubscriptionTier;
  const quotaLimit = getQuotaLimit(tier);
  const quotaUsed = row.games_created_this_month || 0;
  const inTrial = row.trial_ends_at && new Date(row.trial_ends_at) > new Date();

  return {
    tier,
    status: row.status || 'active',
    inTrial: !!inTrial,
    trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
    quotaUsed,
    quotaLimit,
    quotaRemaining: quotaLimit === -1 ? -1 : Math.max(0, quotaLimit - quotaUsed),
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
    cancelAtPeriodEnd: row.cancel_at_period_end || false,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
};

/**
 * Sync subscription from Stripe
 */
export const syncSubscriptionFromStripe = async (
  stripeSubscriptionId: string
): Promise<void> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // Get user ID from subscription metadata or customer
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata:', stripeSubscriptionId);
    return;
  }

  // Determine tier from subscription
  const tier: SubscriptionTier = subscription.status === 'active' || subscription.status === 'trialing'
    ? 'premium'
    : 'free';

  // Extract period timestamps
  const periodStart = (subscription as any).current_period_start
    ? new Date((subscription as any).current_period_start * 1000)
    : null;
  const periodEnd = (subscription as any).current_period_end
    ? new Date((subscription as any).current_period_end * 1000)
    : null;
  const trialStart = (subscription as any).trial_start
    ? new Date((subscription as any).trial_start * 1000)
    : null;
  const trialEnd = (subscription as any).trial_end
    ? new Date((subscription as any).trial_end * 1000)
    : null;

  // Update database in transaction
  await pool.query('BEGIN');

  try {
    // Update subscriptions table
    await pool.query(
      `UPDATE subscriptions
       SET tier = $1,
           status = $2,
           current_period_start = $3,
           current_period_end = $4,
           cancel_at_period_end = $5,
           trial_start = $6,
           trial_end = $7,
           updated_at = NOW()
       WHERE stripe_subscription_id = $8`,
      [
        tier,
        subscription.status,
        periodStart,
        periodEnd,
        subscription.cancel_at_period_end,
        trialStart,
        trialEnd,
        stripeSubscriptionId,
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
 * Create Stripe billing portal session
 */
export const createBillingPortalSession = async (
  userId: number
): Promise<{ portalUrl: string }> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const result = await pool.query(
    'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: result.rows[0].stripe_customer_id,
    return_url: `${process.env.FRONTEND_URL}/account/subscription`,
  });

  return {
    portalUrl: session.url,
  };
};
