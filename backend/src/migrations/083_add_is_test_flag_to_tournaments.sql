-- Migration 083: Add is_test flag to tournaments table
-- This prevents test tournaments from appearing in production

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Create index for filtering test tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_is_test ON tournaments(is_test);

-- Mark existing test tournaments
UPDATE tournaments
SET is_test = true
WHERE name ILIKE '%test tournament%' OR name ILIKE '%test%tournament%';

-- Add comment
COMMENT ON COLUMN tournaments.is_test IS 'Flag to mark test/demo tournaments that should not appear in production';
