-- Create club events calendar system

-- Club events table
CREATE TABLE IF NOT EXISTS club_events (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'meetup' CHECK (event_type IN ('meetup', 'tournament', 'social', 'training', 'other')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(255),
  max_participants INTEGER,
  is_members_only BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_event_times CHECK (end_time > start_time)
);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS club_event_rsvps (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES club_events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  rsvp_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(event_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_events_club ON club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_start_time ON club_events(start_time);
CREATE INDEX IF NOT EXISTS idx_club_events_created_by ON club_events(created_by);
CREATE INDEX IF NOT EXISTS idx_club_event_rsvps_event ON club_event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_club_event_rsvps_user ON club_event_rsvps(user_id);

-- Comments
COMMENT ON TABLE club_events IS 'Club events and meetups';
COMMENT ON TABLE club_event_rsvps IS 'Event attendance tracking';
COMMENT ON COLUMN club_events.is_members_only IS 'Whether event is restricted to club members only';
COMMENT ON COLUMN club_event_rsvps.status IS 'RSVP status: going, maybe, or not_going';
