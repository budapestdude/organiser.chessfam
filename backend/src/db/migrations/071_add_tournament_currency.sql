-- Migration 071: Add currency field to tournaments table
-- Allows organizers to set the currency for entry fees and prize pools

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add index for filtering by currency
CREATE INDEX IF NOT EXISTS idx_tournaments_currency ON tournaments(currency);

-- Comment
COMMENT ON COLUMN tournaments.currency IS
  'Currency code for entry fee and prize pool (ISO 4217, e.g., USD, EUR, GBP). Default is USD.';

-- Example values: 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', etc.
