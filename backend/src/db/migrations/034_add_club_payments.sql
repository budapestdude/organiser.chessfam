-- Extend payments table to support club membership payments
-- This enables linking club memberships to payment records

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL;

-- Add index for club payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_club_id ON payments(club_id);

-- Add comment
COMMENT ON COLUMN payments.club_id IS 'Links payment to a club membership (if applicable)';
