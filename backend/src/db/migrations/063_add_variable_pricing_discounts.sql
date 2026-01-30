-- Migration 063: Add variable pricing discount options to tournaments
-- Allows organizers to set discounts for junior, senior, and women players

-- Add discount columns to tournaments table
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS junior_discount DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS senior_discount DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS women_discount DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS junior_age_max INTEGER,
ADD COLUMN IF NOT EXISTS senior_age_min INTEGER;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_tournaments_junior_discount ON tournaments(junior_discount) WHERE junior_discount > 0;
CREATE INDEX IF NOT EXISTS idx_tournaments_senior_discount ON tournaments(senior_discount) WHERE senior_discount > 0;
CREATE INDEX IF NOT EXISTS idx_tournaments_women_discount ON tournaments(women_discount) WHERE women_discount > 0;

-- Comments
COMMENT ON COLUMN tournaments.junior_discount IS
  'Percentage discount for junior players (e.g., 20.00 for 20% off). Default 0 means no discount.';
COMMENT ON COLUMN tournaments.senior_discount IS
  'Percentage discount for senior players (e.g., 15.00 for 15% off). Default 0 means no discount.';
COMMENT ON COLUMN tournaments.women_discount IS
  'Percentage discount for women players (e.g., 25.00 for 25% off). Default 0 means no discount.';
COMMENT ON COLUMN tournaments.junior_age_max IS
  'Maximum age for junior discount eligibility (e.g., 18). NULL means use default (18).';
COMMENT ON COLUMN tournaments.senior_age_min IS
  'Minimum age for senior discount eligibility (e.g., 65). NULL means use default (65).';

-- Example usage:
-- junior_discount = 20.00 means 20% off for juniors
-- senior_discount = 15.00 means 15% off for seniors
-- women_discount = 25.00 means 25% off for women
-- All discounts are percentage-based and stack with early bird pricing
