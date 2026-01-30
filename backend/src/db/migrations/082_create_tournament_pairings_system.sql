-- Create tournament_games table for storing pairings and results
CREATE TABLE IF NOT EXISTS tournament_games (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  board_number INTEGER NOT NULL,
  white_player_id INTEGER NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  black_player_id INTEGER NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  result VARCHAR(20) DEFAULT 'ongoing' CHECK (result IN ('white_win', 'black_win', 'draw', 'ongoing', 'forfeit_white', 'forfeit_black')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  pgn TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, round_number, board_number)
);

-- Add pairing_number to tournament_registrations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_registrations'
    AND column_name = 'pairing_number'
  ) THEN
    ALTER TABLE tournament_registrations
    ADD COLUMN pairing_number INTEGER;
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tournament_games_tournament_round
  ON tournament_games(tournament_id, round_number);

CREATE INDEX IF NOT EXISTS idx_tournament_games_players
  ON tournament_games(white_player_id, black_player_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_pairing
  ON tournament_registrations(tournament_id, pairing_number);

-- Add tournament pairing system field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments'
    AND column_name = 'pairing_system'
  ) THEN
    ALTER TABLE tournaments
    ADD COLUMN pairing_system VARCHAR(20) DEFAULT 'dutch' CHECK (pairing_system IN ('dutch', 'burstein', 'swiss', 'round_robin'));
  END IF;
END $$;

-- Add current_round to tournaments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments'
    AND column_name = 'current_round'
  ) THEN
    ALTER TABLE tournaments
    ADD COLUMN current_round INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add total_rounds to tournaments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments'
    AND column_name = 'total_rounds'
  ) THEN
    ALTER TABLE tournaments
    ADD COLUMN total_rounds INTEGER DEFAULT 9;
  END IF;
END $$;
