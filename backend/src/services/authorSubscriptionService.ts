import { stripe } from '../config/stripe';
import pool from '../config/database';
import { getPremiumDiscountSettings } from './platformSettingsService';

export interface AuthorPricingConfig {
  authorId: number;
  enabled: boolean;
  monthlyPriceCents: number | null;
  monthlyPremiumDiscountPercent: number;
  annualPriceCents: number | null;
  annualPremiumDiscountPercent: number;
  defaultPreviewPercent: number;
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeMonthlyPremiumPriceId: string | null;
  stripeAnnualPriceId: string | null;
  stripeAnnualPremiumPriceId: string | null;
}

export interface AuthorSubscription {
  id: number;
  authorId: number;
  subscriberId: number;
  status: string;
  tier: 'monthly' | 'annual';
  amount: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriberInfo {
  subscriberId: number;
  subscriberName: string;
  subscriberEmail: string;
  tier: 'monthly' | 'annual';
  status: string;
  amount: number;
  startDate: Date;
  currentPeriodEnd: Date | null;
  isPremiumSubscriber: boolean;
}

export interface RevenueStats {
  totalRevenue: number;
  mrr: number; // Monthly Recurring Revenue
  totalSubscribers: number;
  monthlySubscribers: number;
  annualSubscribers: number;
  newSubscribersThisMonth: number;
  canceledSubscribersThisMonth: number;
  churnRate: number;
  averageRevenuePerSubscriber: number;
}

/**
 * Setup author pricing with Stripe products and prices
 */
export const setupAuthorPricing = async (
  authorId: number,
  authorName: string,
  monthlyPriceCents: number,
  annualPriceCents: number,
  defaultPreviewPercent: number = 30
): Promise<AuthorPricingConfig> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get site-wide premium discount settings
  const { enabled: premiumDiscountEnabled, discountPercent: premiumDiscountPercent } = await getPremiumDiscountSettings();

  // Create Stripe product for this author
  const product = await stripe.products.create({
    name: `Subscription to ${authorName}'s Content`,
    description: `Access to all paid blogs by ${authorName}`,
    metadata: {
      author_id: authorId.toString(),
      type: 'author_subscription',
    },
  });

  // Create monthly price (regular)
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: monthlyPriceCents,
    recurring: { interval: 'month' },
    metadata: {
      author_id: authorId.toString(),
      tier: 'monthly',
      is_premium_discount: 'false',
    },
  });

  // Create monthly premium discount price (if discount enabled and > 0)
  let monthlyPremiumPrice = null;
  if (premiumDiscountEnabled && premiumDiscountPercent > 0) {
    const discountedAmount = Math.round(
      monthlyPriceCents * (1 - premiumDiscountPercent / 100)
    );
    monthlyPremiumPrice = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: discountedAmount,
      recurring: { interval: 'month' },
      metadata: {
        author_id: authorId.toString(),
        tier: 'monthly',
        is_premium_discount: 'true',
      },
    });
  }

  // Create annual price (regular)
  const annualPrice = await stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: annualPriceCents,
    recurring: { interval: 'year' },
    metadata: {
      author_id: authorId.toString(),
      tier: 'annual',
      is_premium_discount: 'false',
    },
  });

  // Create annual premium discount price (if discount enabled and > 0)
  let annualPremiumPrice = null;
  if (premiumDiscountEnabled && premiumDiscountPercent > 0) {
    const discountedAmount = Math.round(
      annualPriceCents * (1 - premiumDiscountPercent / 100)
    );
    annualPremiumPrice = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: discountedAmount,
      recurring: { interval: 'year' },
      metadata: {
        author_id: authorId.toString(),
        tier: 'annual',
        is_premium_discount: 'true',
      },
    });
  }

  // Save to database (discount percents are deprecated, stored as 0)
  const result = await pool.query(
    `INSERT INTO author_subscription_pricing (
      author_id,
      enabled,
      monthly_price_cents,
      monthly_premium_discount_percent,
      stripe_monthly_price_id,
      stripe_monthly_premium_price_id,
      annual_price_cents,
      annual_premium_discount_percent,
      stripe_annual_price_id,
      stripe_annual_premium_price_id,
      default_preview_percent,
      stripe_product_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (author_id) DO UPDATE SET
      enabled = $2,
      monthly_price_cents = $3,
      monthly_premium_discount_percent = $4,
      stripe_monthly_price_id = $5,
      stripe_monthly_premium_price_id = $6,
      annual_price_cents = $7,
      annual_premium_discount_percent = $8,
      stripe_annual_price_id = $9,
      stripe_annual_premium_price_id = $10,
      default_preview_percent = $11,
      stripe_product_id = $12,
      updated_at = NOW()
    RETURNING *`,
    [
      authorId,
      true, // enabled
      monthlyPriceCents,
      0, // monthly_premium_discount_percent - deprecated, use platform_settings
      monthlyPrice.id,
      monthlyPremiumPrice?.id || null,
      annualPriceCents,
      0, // annual_premium_discount_percent - deprecated, use platform_settings
      annualPrice.id,
      annualPremiumPrice?.id || null,
      defaultPreviewPercent,
      product.id,
    ]
  );

  return mapPricingRow(result.rows[0]);
};

/**
 * Get author pricing configuration
 * Note: Returns site-wide premium discount settings (not per-author)
 */
export const getAuthorPricing = async (
  authorId: number
): Promise<AuthorPricingConfig | null> => {
  const result = await pool.query(
    'SELECT * FROM author_subscription_pricing WHERE author_id = $1',
    [authorId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const pricing = mapPricingRow(result.rows[0]);

  // Inject site-wide premium discount settings
  const { enabled: premiumDiscountEnabled, discountPercent: premiumDiscountPercent } = await getPremiumDiscountSettings();

  if (premiumDiscountEnabled) {
    pricing.monthlyPremiumDiscountPercent = premiumDiscountPercent;
    pricing.annualPremiumDiscountPercent = premiumDiscountPercent;
  } else {
    pricing.monthlyPremiumDiscountPercent = 0;
    pricing.annualPremiumDiscountPercent = 0;
  }

  return pricing;
};

/**
 * Create Stripe checkout session for author subscription
 */
export const createAuthorSubscriptionCheckout = async (
  authorId: number,
  subscriberId: number,
  subscriberEmail: string,
  tier: 'monthly' | 'annual'
): Promise<{ checkoutUrl: string; sessionId: string }> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get pricing config
  const pricing = await getAuthorPricing(authorId);
  if (!pricing || !pricing.enabled) {
    throw new Error('Author subscription not available');
  }

  // Check if user is platform premium member
  const userResult = await pool.query(
    'SELECT subscription_tier FROM users WHERE id = $1',
    [subscriberId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const isPremiumMember = userResult.rows[0].subscription_tier === 'premium';

  // Select appropriate price ID
  let priceId: string | null;
  let discountApplied = 0;

  if (tier === 'monthly') {
    if (isPremiumMember && pricing.stripeMonthlyPremiumPriceId) {
      priceId = pricing.stripeMonthlyPremiumPriceId;
      discountApplied = pricing.monthlyPremiumDiscountPercent;
    } else {
      priceId = pricing.stripeMonthlyPriceId;
    }
  } else {
    if (isPremiumMember && pricing.stripeAnnualPremiumPriceId) {
      priceId = pricing.stripeAnnualPremiumPriceId;
      discountApplied = pricing.annualPremiumDiscountPercent;
    } else {
      priceId = pricing.stripeAnnualPriceId;
    }
  }

  if (!priceId) {
    throw new Error('Price not configured for selected tier');
  }

  // Get or create Stripe customer
  const existingSubResult = await pool.query(
    'SELECT stripe_customer_id FROM author_subscriptions WHERE subscriber_id = $1 LIMIT 1',
    [subscriberId]
  );

  let customerId: string | undefined;

  if (existingSubResult.rows.length > 0 && existingSubResult.rows[0].stripe_customer_id) {
    customerId = existingSubResult.rows[0].stripe_customer_id;
  } else {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: subscriberEmail,
      metadata: {
        user_id: subscriberId.toString(),
      },
    });
    customerId = customer.id;
  }

  // Create checkout session
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
      metadata: {
        author_id: authorId.toString(),
        subscriber_id: subscriberId.toString(),
        tier,
        is_premium_subscriber: isPremiumMember.toString(),
        discount_applied: discountApplied.toString(),
      },
    },
    success_url: `${process.env.FRONTEND_URL}/author-subscriptions?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/blogs?canceled=true`,
    metadata: {
      author_id: authorId.toString(),
      subscriber_id: subscriberId.toString(),
      tier,
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
 * Check if user has active subscription to author
 */
export const checkAuthorSubscriptionAccess = async (
  authorId: number,
  subscriberId: number | null
): Promise<boolean> => {
  if (!subscriberId) {
    return false;
  }

  const result = await pool.query(
    `SELECT id FROM author_subscriptions
     WHERE author_id = $1 AND subscriber_id = $2 AND status = 'active'`,
    [authorId, subscriberId]
  );

  return result.rows.length > 0;
};

/**
 * Get user's subscriptions to authors
 */
export const getUserAuthorSubscriptions = async (
  subscriberId: number
): Promise<AuthorSubscription[]> => {
  const result = await pool.query(
    `SELECT
      s.*,
      u.username as author_name,
      u.email as author_email
     FROM author_subscriptions s
     JOIN users u ON u.id = s.author_id
     WHERE s.subscriber_id = $1
     ORDER BY s.created_at DESC`,
    [subscriberId]
  );

  return result.rows.map(mapSubscriptionRow);
};

/**
 * Cancel author subscription at period end
 */
export const cancelAuthorSubscription = async (
  subscriptionId: number,
  subscriberId: number
): Promise<void> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Verify ownership
  const result = await pool.query(
    'SELECT stripe_subscription_id FROM author_subscriptions WHERE id = $1 AND subscriber_id = $2',
    [subscriptionId, subscriberId]
  );

  if (result.rows.length === 0) {
    throw new Error('Subscription not found');
  }

  const stripeSubscriptionId = result.rows[0].stripe_subscription_id;

  if (stripeSubscriptionId) {
    // Cancel at period end in Stripe
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Update database
  await pool.query(
    `UPDATE author_subscriptions
     SET cancel_at_period_end = TRUE,
         canceled_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [subscriptionId]
  );
};

/**
 * Reactivate canceled author subscription
 */
export const reactivateAuthorSubscription = async (
  subscriptionId: number,
  subscriberId: number
): Promise<void> => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Verify ownership
  const result = await pool.query(
    `SELECT stripe_subscription_id, current_period_end
     FROM author_subscriptions
     WHERE id = $1 AND subscriber_id = $2`,
    [subscriptionId, subscriberId]
  );

  if (result.rows.length === 0) {
    throw new Error('Subscription not found');
  }

  const { stripe_subscription_id, current_period_end } = result.rows[0];

  // Check if still in current period
  if (new Date() > new Date(current_period_end)) {
    throw new Error('Subscription period has already ended');
  }

  if (stripe_subscription_id) {
    // Reactivate in Stripe
    await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: false,
    });
  }

  // Update database
  await pool.query(
    `UPDATE author_subscriptions
     SET cancel_at_period_end = FALSE,
         canceled_at = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [subscriptionId]
  );
};

/**
 * Get author's subscribers with filters
 */
export const getAuthorSubscribers = async (
  authorId: number,
  filters?: {
    status?: string;
    tier?: 'monthly' | 'annual';
    limit?: number;
    offset?: number;
  }
): Promise<SubscriberInfo[]> => {
  let query = `
    SELECT
      s.subscriber_id,
      u.username as subscriber_name,
      u.email as subscriber_email,
      s.tier,
      s.status,
      s.amount,
      s.created_at as start_date,
      s.current_period_end,
      CASE WHEN u.subscription_tier = 'premium' THEN TRUE ELSE FALSE END as is_premium_subscriber
    FROM author_subscriptions s
    JOIN users u ON u.id = s.subscriber_id
    WHERE s.author_id = $1
  `;

  const params: any[] = [authorId];
  let paramIndex = 2;

  if (filters?.status) {
    query += ` AND s.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters?.tier) {
    query += ` AND s.tier = $${paramIndex}`;
    params.push(filters.tier);
    paramIndex++;
  }

  query += ' ORDER BY s.created_at DESC';

  if (filters?.limit) {
    query += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }

  if (filters?.offset) {
    query += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
    paramIndex++;
  }

  const result = await pool.query(query, params);

  return result.rows.map(row => ({
    subscriberId: row.subscriber_id,
    subscriberName: row.subscriber_name,
    subscriberEmail: row.subscriber_email,
    tier: row.tier,
    status: row.status,
    amount: row.amount,
    startDate: new Date(row.start_date),
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
    isPremiumSubscriber: row.is_premium_subscriber,
  }));
};

/**
 * Get author's revenue statistics
 */
export const getAuthorRevenue = async (
  authorId: number,
  dateRange?: { startDate?: Date; endDate?: Date }
): Promise<RevenueStats> => {
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

  // Get subscriber counts
  const subscribersResult = await pool.query(
    `SELECT
      COUNT(*) as total_subscribers,
      COUNT(*) FILTER (WHERE tier = 'monthly') as monthly_subscribers,
      COUNT(*) FILTER (WHERE tier = 'annual') as annual_subscribers
    FROM author_subscriptions
    WHERE author_id = $1 AND status = 'active'`,
    [authorId]
  );

  const totalSubscribers = parseInt(subscribersResult.rows[0].total_subscribers) || 0;
  const monthlySubscribers = parseInt(subscribersResult.rows[0].monthly_subscribers) || 0;
  const annualSubscribers = parseInt(subscribersResult.rows[0].annual_subscribers) || 0;

  // Get new subscribers this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newSubsResult = await pool.query(
    `SELECT COUNT(*) as new_subscribers
     FROM author_subscriptions
     WHERE author_id = $1 AND created_at >= $2`,
    [authorId, firstDayOfMonth]
  );

  const newSubscribersThisMonth = parseInt(newSubsResult.rows[0].new_subscribers) || 0;

  // Get canceled subscribers this month
  const canceledSubsResult = await pool.query(
    `SELECT COUNT(*) as canceled_subscribers
     FROM author_subscriptions
     WHERE author_id = $1
       AND status = 'canceled'
       AND canceled_at >= $2`,
    [authorId, firstDayOfMonth]
  );

  const canceledSubscribersThisMonth = parseInt(canceledSubsResult.rows[0].canceled_subscribers) || 0;

  // Calculate churn rate
  const subscribersAtStartOfMonth = totalSubscribers + canceledSubscribersThisMonth - newSubscribersThisMonth;
  const churnRate = subscribersAtStartOfMonth > 0
    ? (canceledSubscribersThisMonth / subscribersAtStartOfMonth) * 100
    : 0;

  // Get total revenue (with optional date range)
  let revenueQuery = `
    SELECT SUM(amount) as total_revenue
    FROM author_subscription_revenue
    WHERE author_id = $1
  `;
  const revenueParams: any[] = [authorId];

  if (dateRange?.startDate) {
    revenueQuery += ` AND created_at >= $2`;
    revenueParams.push(dateRange.startDate);
  }

  if (dateRange?.endDate) {
    revenueQuery += ` AND created_at <= $${revenueParams.length + 1}`;
    revenueParams.push(dateRange.endDate);
  }

  const revenueResult = await pool.query(revenueQuery, revenueParams);
  const totalRevenue = parseInt(revenueResult.rows[0].total_revenue) || 0;

  // Calculate average revenue per subscriber
  const averageRevenuePerSubscriber = totalSubscribers > 0
    ? totalRevenue / totalSubscribers
    : 0;

  return {
    totalRevenue,
    mrr,
    totalSubscribers,
    monthlySubscribers,
    annualSubscribers,
    newSubscribersThisMonth,
    canceledSubscribersThisMonth,
    churnRate: Math.round(churnRate * 100) / 100,
    averageRevenuePerSubscriber: Math.round(averageRevenuePerSubscriber),
  };
};

/**
 * Helper: Map database row to PricingConfig
 */
function mapPricingRow(row: any): AuthorPricingConfig {
  return {
    authorId: row.author_id,
    enabled: row.enabled,
    monthlyPriceCents: row.monthly_price_cents,
    monthlyPremiumDiscountPercent: row.monthly_premium_discount_percent,
    annualPriceCents: row.annual_price_cents,
    annualPremiumDiscountPercent: row.annual_premium_discount_percent,
    defaultPreviewPercent: row.default_preview_percent,
    stripeProductId: row.stripe_product_id,
    stripeMonthlyPriceId: row.stripe_monthly_price_id,
    stripeMonthlyPremiumPriceId: row.stripe_monthly_premium_price_id,
    stripeAnnualPriceId: row.stripe_annual_price_id,
    stripeAnnualPremiumPriceId: row.stripe_annual_premium_price_id,
  };
}

/**
 * Helper: Map database row to Subscription
 */
function mapSubscriptionRow(row: any): AuthorSubscription {
  return {
    id: row.id,
    authorId: row.author_id,
    subscriberId: row.subscriber_id,
    status: row.status,
    tier: row.tier,
    amount: row.amount,
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}
