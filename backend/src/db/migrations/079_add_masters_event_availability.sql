-- Migration 079: Add event availability to masters table
-- Allows masters to list themselves as available for tournaments, leagues, and teams

-- Add event availability columns to masters table
ALTER TABLE masters ADD COLUMN IF NOT EXISTS available_for_events BOOLEAN DEFAULT false;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS event_types TEXT[] DEFAULT '{}';
ALTER TABLE masters ADD COLUMN IF NOT EXISTS event_rate_per_day DECIMAL(10,2);
ALTER TABLE masters ADD COLUMN IF NOT EXISTS event_currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE masters ADD COLUMN IF NOT EXISTS event_notes TEXT;

-- Add index for filtering masters by event availability
CREATE INDEX IF NOT EXISTS idx_masters_available_for_events ON masters(available_for_events) WHERE available_for_events = true;

-- Comment the columns for documentation
COMMENT ON COLUMN masters.available_for_events IS 'Whether the master is available to be hired for events';
COMMENT ON COLUMN masters.event_types IS 'Types of events the master is available for (tournament, league, simul, exhibition)';
COMMENT ON COLUMN masters.event_rate_per_day IS 'Daily rate for event participation';
COMMENT ON COLUMN masters.event_currency IS 'Currency for event rate';
COMMENT ON COLUMN masters.event_notes IS 'Additional notes about event availability, requirements, or preferences';
