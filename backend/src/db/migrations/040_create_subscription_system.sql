-- Migration 040: Create Subscription System
-- Adds subscription tiers, quotas, and trial management

-- Add subscription-related columns to users table (cached for fast queries)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS games_created_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS quota_reset_date DATE;

-- Create subscriptions table (source of truth for subscription data)
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create quota usage tracking table (audit trail)
CREATE TABLE IF NOT EXISTS subscription_quota_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  quota_used INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for quota usage queries
CREATE INDEX IF NOT EXISTS idx_quota_usage_user_id ON subscription_quota_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_usage_created_at ON subscription_quota_usage(created_at);

-- Backfill existing users with 14-day trial
UPDATE users
SET trial_ends_at = NOW() + INTERVAL '14 days',
    quota_reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
WHERE trial_ends_at IS NULL;

-- Create subscription records for all existing users
INSERT INTO subscriptions (user_id, tier, status, trial_start, trial_end)
SELECT id, 'free', 'active', NOW(), NOW() + INTERVAL '14 days'
FROM users
WHERE id NOT IN (SELECT user_id FROM subscriptions);
