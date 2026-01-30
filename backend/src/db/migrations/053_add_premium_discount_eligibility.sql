-- Migration: Add premium discount eligibility to tournaments, clubs, and masters
-- This allows staff to mark which entities participate in the 10% premium member discount

-- Add premium_discount_eligible column to tournaments
ALTER TABLE tournaments
ADD COLUMN premium_discount_eligible BOOLEAN DEFAULT FALSE;

-- Add premium_discount_eligible column to clubs
ALTER TABLE clubs
ADD COLUMN premium_discount_eligible BOOLEAN DEFAULT FALSE;

-- Add premium_discount_eligible column to masters
ALTER TABLE masters
ADD COLUMN premium_discount_eligible BOOLEAN DEFAULT FALSE;

-- Add indexes for efficient filtering
CREATE INDEX idx_tournaments_premium_discount ON tournaments(premium_discount_eligible);
CREATE INDEX idx_clubs_premium_discount ON clubs(premium_discount_eligible);
CREATE INDEX idx_masters_premium_discount ON masters(premium_discount_eligible);

-- Add comments
COMMENT ON COLUMN tournaments.premium_discount_eligible IS
  'True if this tournament offers 10% discount to premium members. Managed by staff only.';

COMMENT ON COLUMN clubs.premium_discount_eligible IS
  'True if this club offers 10% discount to premium members. Managed by staff only.';

COMMENT ON COLUMN masters.premium_discount_eligible IS
  'True if this master offers 10% discount to premium members on challenges. Managed by staff only.';
