-- Add festival parent functionality
-- Allows tournaments to be converted into festivals with multiple events

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS is_festival_parent BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN tournaments.is_festival_parent IS 'True if this tournament is a festival parent container (not a real event, just a grouping)';
COMMENT ON COLUMN tournaments.festival_id IS 'References the parent festival if this tournament is an event within a festival';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_festival_parent ON tournaments(is_festival_parent) WHERE is_festival_parent = TRUE;
CREATE INDEX IF NOT EXISTS idx_tournaments_festival_id ON tournaments(festival_id) WHERE festival_id IS NOT NULL;
