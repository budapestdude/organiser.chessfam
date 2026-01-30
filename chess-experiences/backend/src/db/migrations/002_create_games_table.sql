-- Create Games table for game listings
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_name VARCHAR(255) NOT NULL,
  venue_address TEXT,
  venue_lat DECIMAL(10, 8),
  venue_lng DECIMAL(11, 8),
  game_date DATE NOT NULL,
  game_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  time_control VARCHAR(100),
  player_level VARCHAR(50),
  max_players INTEGER DEFAULT 1,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_game_date CHECK (game_date >= CURRENT_DATE AND game_date <= CURRENT_DATE + INTERVAL '30 days')
);

-- Create Game Participants table (join table for users joining games)
CREATE TABLE IF NOT EXISTS game_participants (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'confirmed',
  UNIQUE(game_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_creator_id ON games(creator_id);
CREATE INDEX IF NOT EXISTS idx_games_game_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_venue_name ON games(venue_name);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);

-- Comments
COMMENT ON TABLE games IS 'Game listings created by users at venues';
COMMENT ON COLUMN games.creator_id IS 'User who created the game listing';
COMMENT ON COLUMN games.venue_name IS 'Name of the venue where game will be played';
COMMENT ON COLUMN games.game_date IS 'Date of the game (within 30 days from creation)';
COMMENT ON COLUMN games.time_control IS 'Chess time control (e.g., "Blitz 5+3", "Rapid 15+10")';
COMMENT ON COLUMN games.player_level IS 'Expected player level (e.g., "Beginner", "Intermediate", "Advanced")';
COMMENT ON COLUMN games.max_players IS 'Maximum number of players who can join';
COMMENT ON COLUMN games.status IS 'Game status: open, full, cancelled, completed';

COMMENT ON TABLE game_participants IS 'Users who have joined game listings';
COMMENT ON COLUMN game_participants.status IS 'Participant status: confirmed, cancelled, no-show';
