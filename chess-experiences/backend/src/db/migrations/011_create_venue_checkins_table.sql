-- Create venue check-ins table
CREATE TABLE IF NOT EXISTS venue_checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id INTEGER NOT NULL REFERENCES venue_submissions(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checkin_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checkout_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, venue_id, checkin_date) -- One check-in per user per venue per day
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_venue_checkins_venue_id ON venue_checkins(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_checkins_user_id ON venue_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_checkins_date ON venue_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_venue_checkins_status ON venue_checkins(status);
