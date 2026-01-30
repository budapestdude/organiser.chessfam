CREATE TABLE IF NOT EXISTS tournament_registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL,

  -- Player details
  player_name VARCHAR(255) NOT NULL,
  player_rating INTEGER,
  player_email VARCHAR(255) NOT NULL,
  player_phone VARCHAR(50),

  -- Registration details
  entry_fee DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed' NOT NULL CHECK (status IN (
    'pending', 'confirmed', 'cancelled', 'checked_in'
  )),

  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON tournament_registrations(status);
