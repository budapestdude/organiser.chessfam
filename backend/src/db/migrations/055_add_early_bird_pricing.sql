-- Migration 055: Add early bird pricing support to tournaments
-- Allows organizers to set up to 3 tiers of early bird discounts

-- Add early bird pricing column (stores array of pricing tiers)
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS early_bird_pricing JSONB DEFAULT '[]'::jsonb;

-- Index for querying early bird pricing
CREATE INDEX IF NOT EXISTS idx_tournaments_early_bird_pricing
ON tournaments USING GIN (early_bird_pricing);

COMMENT ON COLUMN tournaments.early_bird_pricing IS
'Array of early bird pricing tiers. Each tier contains: deadline (ISO date), discount (number), discount_type (percentage/fixed), label (string). Example: [{"deadline": "2025-03-01", "discount": 20, "discount_type": "percentage", "label": "Super Early Bird"}]';

-- Example early bird pricing structure:
-- [
--   {
--     "deadline": "2025-03-01",
--     "discount": 20,
--     "discount_type": "percentage",
--     "label": "Super Early Bird"
--   },
--   {
--     "deadline": "2025-04-01",
--     "discount": 15,
--     "discount_type": "percentage",
--     "label": "Early Bird"
--   },
--   {
--     "deadline": "2025-05-01",
--     "discount": 10,
--     "discount_type": "percentage",
--     "label": "Regular Early Bird"
--   }
-- ]
