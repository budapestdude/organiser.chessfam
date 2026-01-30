-- Enhance club_memberships table with additional fields
-- This migration adds columns from the disabled migration 006 to support payment tracking

ALTER TABLE club_memberships
  ADD COLUMN IF NOT EXISTS membership_type VARCHAR(50) DEFAULT 'monthly' CHECK (membership_type IN ('monthly', 'yearly', 'lifetime')),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for payment lookups
CREATE INDEX IF NOT EXISTS idx_club_memberships_payment_id ON club_memberships(payment_id);

-- Add comment
COMMENT ON TABLE club_memberships IS 'Club membership records with payment tracking';
