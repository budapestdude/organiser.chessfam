-- Migration 045: Tournament Categories
-- Adds support for: one-off tournaments, recurring tournaments, and festivals

-- ============================================
-- EXTEND TOURNAMENTS TABLE
-- ============================================

-- Tournament category (one-off, recurring, festival)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_category VARCHAR(50) DEFAULT 'one-off';

-- Recurring tournament functionality (separate statements for IF NOT EXISTS)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(50);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS parent_tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;

-- Festival functionality (parent tournament that contains multiple sub-tournaments)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_festival BOOLEAN DEFAULT FALSE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS festival_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_category ON tournaments(tournament_category);
CREATE INDEX IF NOT EXISTS idx_tournaments_recurring ON tournaments(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_tournaments_parent ON tournaments(parent_tournament_id) WHERE parent_tournament_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tournaments_festival ON tournaments(is_festival) WHERE is_festival = TRUE;
CREATE INDEX IF NOT EXISTS idx_tournaments_festival_id ON tournaments(festival_id) WHERE festival_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN tournaments.tournament_category IS 'Tournament category: one-off (single event), recurring (repeats), festival (collection of tournaments)';
COMMENT ON COLUMN tournaments.is_recurring IS 'Indicates if tournament repeats on a schedule';
COMMENT ON COLUMN tournaments.recurrence_pattern IS 'Recurrence pattern: weekly, biweekly, monthly';
COMMENT ON COLUMN tournaments.recurrence_count IS 'Number of times to repeat (NULL = continues until manually stopped)';
COMMENT ON COLUMN tournaments.parent_tournament_id IS 'References the original recurring tournament this instance was created from';
COMMENT ON COLUMN tournaments.is_festival IS 'TRUE if this is a festival (parent tournament containing multiple sub-tournaments)';
COMMENT ON COLUMN tournaments.festival_id IS 'References the parent festival this tournament belongs to';
