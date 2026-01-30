-- Create challenges table for player-to-player game challenges
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  challenger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id INTEGER REFERENCES venue_submissions(id) ON DELETE SET NULL,
  time_control VARCHAR(50) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  response_message TEXT,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (challenger_id != challenged_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_venue ON challenges(venue_id);
CREATE INDEX IF NOT EXISTS idx_challenges_expires ON challenges(expires_at) WHERE status = 'pending';

-- Function to auto-expire old challenges
CREATE OR REPLACE FUNCTION expire_old_challenges() RETURNS void AS $$
BEGIN
  UPDATE challenges
  SET status = 'expired', updated_at = CURRENT_TIMESTAMP
  WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
