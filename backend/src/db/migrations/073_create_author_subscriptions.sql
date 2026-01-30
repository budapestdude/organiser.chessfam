-- Migration 073: Create Author Subscription System
-- This enables Substack-style author-level subscriptions where users subscribe to authors to access all their paid blogs

-- Create author subscription records table
CREATE TABLE IF NOT EXISTS author_subscriptions (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscriber_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe subscription details
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired')),
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('monthly', 'annual')),

  -- Pricing (stored for historical record)
  amount INTEGER NOT NULL, -- in cents
  currency VARCHAR(3) DEFAULT 'eur',

  -- Billing periods
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,

  -- Trial support
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- One subscription per subscriber per author
  UNIQUE(author_id, subscriber_id)
);

-- Create indexes for author subscriptions
CREATE INDEX idx_author_subs_author ON author_subscriptions(author_id);
CREATE INDEX idx_author_subs_subscriber ON author_subscriptions(subscriber_id);
CREATE INDEX idx_author_subs_stripe_sub ON author_subscriptions(stripe_subscription_id);
CREATE INDEX idx_author_subs_status ON author_subscriptions(status);
CREATE INDEX idx_author_subs_active ON author_subscriptions(author_id, status) WHERE status = 'active';

-- Create author subscription pricing configuration table
CREATE TABLE IF NOT EXISTS author_subscription_pricing (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Enable paid content feature
  enabled BOOLEAN DEFAULT FALSE,

  -- Monthly pricing
  monthly_price_cents INTEGER, -- e.g., 500 = €5/month
  monthly_premium_discount_percent INTEGER DEFAULT 0 CHECK (monthly_premium_discount_percent >= 0 AND monthly_premium_discount_percent <= 100),
  stripe_monthly_price_id VARCHAR(255),
  stripe_monthly_premium_price_id VARCHAR(255), -- Discounted price for premium members

  -- Annual pricing
  annual_price_cents INTEGER, -- e.g., 5000 = €50/year
  annual_premium_discount_percent INTEGER DEFAULT 0 CHECK (annual_premium_discount_percent >= 0 AND annual_premium_discount_percent <= 100),
  stripe_annual_price_id VARCHAR(255),
  stripe_annual_premium_price_id VARCHAR(255), -- Discounted price for premium members

  -- Preview settings (applies to all paid blogs by this author)
  default_preview_percent INTEGER DEFAULT 30 CHECK (default_preview_percent >= 0 AND default_preview_percent <= 100),

  -- Stripe product ID for this author
  stripe_product_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for enabled authors
CREATE INDEX idx_author_pricing_enabled ON author_subscription_pricing(author_id) WHERE enabled = TRUE;

-- Create author subscription revenue tracking table (for analytics)
CREATE TABLE IF NOT EXISTS author_subscription_revenue (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER NOT NULL REFERENCES author_subscriptions(id) ON DELETE CASCADE,

  -- Transaction details
  amount INTEGER NOT NULL, -- in cents
  currency VARCHAR(3) DEFAULT 'eur',
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('monthly', 'annual')),

  -- Premium discount applied
  is_premium_subscriber BOOLEAN DEFAULT FALSE,
  discount_amount INTEGER DEFAULT 0, -- in cents

  -- Stripe details
  stripe_invoice_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),

  -- Type of revenue
  revenue_type VARCHAR(30) NOT NULL CHECK (revenue_type IN ('initial_subscription', 'renewal', 'upgrade', 'downgrade')),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for revenue tracking
CREATE INDEX idx_author_revenue_author ON author_subscription_revenue(author_id);
CREATE INDEX idx_author_revenue_created ON author_subscription_revenue(created_at DESC);
CREATE INDEX idx_author_revenue_author_date ON author_subscription_revenue(author_id, created_at DESC);

-- Comments
COMMENT ON TABLE author_subscriptions IS 'Substack-style author subscriptions - users subscribe to authors to access all their paid content';
COMMENT ON TABLE author_subscription_pricing IS 'Author pricing configuration for paid content subscriptions';
COMMENT ON TABLE author_subscription_revenue IS 'Revenue tracking for author subscriptions (analytics and reporting)';
