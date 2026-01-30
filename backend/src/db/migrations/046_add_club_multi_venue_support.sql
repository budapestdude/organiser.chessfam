-- Migration 046: Multi-Venue Club Support
-- Allows clubs to be associated with multiple venues and have recurring club nights at different locations

-- ============================================
-- CLUB VENUES JUNCTION TABLE
-- ============================================

-- Junction table to link clubs to multiple venues
CREATE TABLE IF NOT EXISTS club_venues (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, venue_id)
);

CREATE INDEX IF NOT EXISTS idx_club_venues_club ON club_venues(club_id);
CREATE INDEX IF NOT EXISTS idx_club_venues_venue ON club_venues(venue_id);

COMMENT ON TABLE club_venues IS 'Links clubs to multiple venues where they meet';
COMMENT ON COLUMN club_venues.is_primary IS 'Indicates the primary meeting venue for the club';

-- ============================================
-- ENHANCE CLUB EVENTS WITH VENUES & RECURRING PATTERNS
-- ============================================

-- Add venue reference to club events
ALTER TABLE club_events ADD COLUMN IF NOT EXISTS venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL;

-- Add recurring pattern support
ALTER TABLE club_events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE club_events ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(50); -- weekly, biweekly, monthly
ALTER TABLE club_events ADD COLUMN IF NOT EXISTS day_of_week INTEGER; -- 0 = Sunday, 6 = Saturday
ALTER TABLE club_events ADD COLUMN IF NOT EXISTS time_of_day TIME; -- e.g., '18:30'
ALTER TABLE club_events ADD COLUMN IF NOT EXISTS parent_event_id INTEGER REFERENCES club_events(id) ON DELETE CASCADE;

-- Add time control for chess-specific events
ALTER TABLE club_events ADD COLUMN IF NOT EXISTS time_control VARCHAR(100);

-- Add index for recurring events
CREATE INDEX IF NOT EXISTS idx_club_events_venue ON club_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_club_events_recurring ON club_events(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_club_events_parent ON club_events(parent_event_id) WHERE parent_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_club_events_day_of_week ON club_events(day_of_week) WHERE day_of_week IS NOT NULL;

COMMENT ON COLUMN club_events.venue_id IS 'Venue where this event takes place (optional, can also use location text)';
COMMENT ON COLUMN club_events.is_recurring IS 'TRUE if this is a recurring event template (e.g., "Every Monday at 6pm")';
COMMENT ON COLUMN club_events.recurrence_pattern IS 'How often event recurs: weekly, biweekly, monthly';
COMMENT ON COLUMN club_events.day_of_week IS 'Day of week for recurring events (0=Sunday, 1=Monday, ... 6=Saturday)';
COMMENT ON COLUMN club_events.time_of_day IS 'Time when recurring event starts (e.g., 18:30)';
COMMENT ON COLUMN club_events.parent_event_id IS 'If this is an instance of a recurring event, references the parent template';
COMMENT ON COLUMN club_events.time_control IS 'Time control for chess events (e.g., "Blitz 5+0", "Rapid 15+10")';

-- ============================================
-- BACKFILL EXISTING DATA
-- ============================================

-- For clubs that have a venue_id, add it to club_venues as primary venue
INSERT INTO club_venues (club_id, venue_id, is_primary)
SELECT id, venue_id, TRUE
FROM clubs
WHERE venue_id IS NOT NULL
ON CONFLICT (club_id, venue_id) DO NOTHING;
