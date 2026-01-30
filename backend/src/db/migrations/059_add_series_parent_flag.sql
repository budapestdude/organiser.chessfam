-- Add flag to identify series parent records (virtual containers)
ALTER TABLE tournaments ADD COLUMN is_series_parent BOOLEAN DEFAULT FALSE;

-- Index for efficient filtering
CREATE INDEX idx_tournaments_series_parent ON tournaments(is_series_parent);

-- Update tournament category check constraint to allow 'series'
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_tournament_category_check;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_tournament_category_check
  CHECK (tournament_category IN ('one-off', 'recurring', 'festival', 'series'));

COMMENT ON COLUMN tournaments.is_series_parent IS
  'True if this record represents a tournament series container (not an actual tournament edition)';
