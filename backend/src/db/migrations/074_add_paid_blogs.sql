-- Migration 074: Add Paid Blog Support to Existing Tables
-- Extends blogs and payments tables to support author-level subscriptions

-- Add paid content fields to blogs table
ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preview_percent INTEGER DEFAULT 30 CHECK (preview_percent >= 0 AND preview_percent <= 100);

-- Create indexes for paid blogs
CREATE INDEX IF NOT EXISTS idx_blogs_is_paid ON blogs(is_paid);
CREATE INDEX IF NOT EXISTS idx_blogs_author_paid ON blogs(author_id, is_paid) WHERE is_paid = TRUE;

-- Comments on new blog columns
COMMENT ON COLUMN blogs.is_paid IS 'Whether this blog requires author subscription to read (Substack-style)';
COMMENT ON COLUMN blogs.preview_percent IS 'Percentage of content visible to non-subscribers (0-100, author configurable)';

-- Extend payments table to support author subscriptions
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS author_subscription_id INTEGER REFERENCES author_subscriptions(id) ON DELETE SET NULL;

-- Create index for author subscription payments
CREATE INDEX IF NOT EXISTS idx_payments_author_sub ON payments(author_subscription_id);

-- Update payment_type constraint to include author_subscription
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments
  ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN (
    'master_booking',
    'tournament_entry',
    'club_membership',
    'subscription',
    'author_subscription'
  ));

-- Add cached metrics to users table for performance
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS paid_subscribers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_recurring_revenue INTEGER DEFAULT 0; -- in cents, cached MRR

-- Create index for authors with paid subscribers
CREATE INDEX IF NOT EXISTS idx_users_paid_authors ON users(paid_subscribers_count) WHERE paid_subscribers_count > 0;

-- Comments on new user columns
COMMENT ON COLUMN users.paid_subscribers_count IS 'Cached count of active author subscribers (updated via webhooks)';
COMMENT ON COLUMN users.monthly_recurring_revenue IS 'Cached MRR in cents (updated via webhooks)';
