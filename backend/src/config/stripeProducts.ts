/**
 * Stripe product and pricing configuration for ChessFam Premium subscriptions
 */

export const STRIPE_PRODUCTS = {
  premium_monthly: {
    name: 'ChessFam Premium - Monthly',
    description: 'Unlimited game scheduling and premium features',
    price: 1500, // €15 in cents
    currency: 'eur',
    interval: 'month' as const,
    tier: 'premium' as const,
  },
  premium_annual: {
    name: 'ChessFam Premium - Annual',
    description: 'Unlimited game scheduling and premium features (44% savings)',
    price: 10000, // €100 in cents (€8.33/month)
    currency: 'eur',
    interval: 'year' as const,
    tier: 'premium' as const,
  },
};

export const SUBSCRIPTION_LIMITS = {
  free: {
    games_per_month: 10,
    name: 'Free',
    features: [
      'Create up to 10 games per month',
      'Join unlimited games',
      'Access to community features',
      'Basic chess tools',
    ],
  },
  premium: {
    games_per_month: -1, // unlimited
    name: 'Premium',
    features: [
      'Unlimited game creation',
      'Priority support',
      'Advanced statistics',
      'No ads',
      'Premium badge',
    ],
  },
};

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type BillingInterval = 'month' | 'year';

// Helper function to get quota limit for a tier
export function getQuotaLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_LIMITS[tier].games_per_month;
}

// Helper function to check if tier has unlimited quota
export function hasUnlimitedQuota(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_LIMITS[tier].games_per_month === -1;
}
