-- Migration 041: Game and Tournament Records System
-- Adds ability to record game results, upload PGNs, and control privacy

-- ============================================
-- EXTEND GAMES TABLE FOR RECORDS
-- ============================================

ALTER TABLE games ADD COLUMN IF NOT EXISTS result VARCHAR(50);
ALTER TABLE games ADD COLUMN IF NOT EXISTS pgn_data TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_record_public BOOLEAN DEFAULT TRUE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN games.result IS 'Game result: white_win, black_win, draw, or NULL if not completed';
COMMENT ON COLUMN games.pgn_data IS 'PGN notation data for the game';
COMMENT ON COLUMN games.is_record_public IS 'Whether the game record is publicly visible';
COMMENT ON COLUMN games.completed_at IS 'When the game was marked as completed';
COMMENT ON COLUMN games.winner_id IS 'User ID of the winner (NULL for draw)';
COMMENT ON COLUMN games.notes IS 'Post-game notes or analysis';

-- ============================================
-- EXTEND TOURNAMENTS TABLE FOR RECORDS
-- ============================================

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS results_data JSONB;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_record_public BOOLEAN DEFAULT TRUE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS final_standings TEXT;

COMMENT ON COLUMN tournaments.results_data IS 'Tournament results and standings in JSON format';
COMMENT ON COLUMN tournaments.is_record_public IS 'Whether the tournament record is publicly visible';
COMMENT ON COLUMN tournaments.completed_at IS 'When the tournament was marked as completed';
COMMENT ON COLUMN tournaments.final_standings IS 'Final standings/results text';

-- ============================================
-- CREATE GAME_RESULTS TABLE
-- ============================================
-- Individual match results within a game/tournament

CREATE TABLE IF NOT EXISTS game_results (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER,
  white_player_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  black_player_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  white_player_name VARCHAR(255),
  black_player_name VARCHAR(255),
  result VARCHAR(50), -- white_win, black_win, draw
  pgn_data TEXT,
  moves_count INTEGER,
  time_control VARCHAR(100),
  played_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_result CHECK (result IN ('white_win', 'black_win', 'draw', 'ongoing', 'abandoned'))
);

CREATE INDEX IF NOT EXISTS idx_game_results_game ON game_results(game_id);
CREATE INDEX IF NOT EXISTS idx_game_results_tournament ON game_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_game_results_white_player ON game_results(white_player_id);
CREATE INDEX IF NOT EXISTS idx_game_results_black_player ON game_results(black_player_id);

COMMENT ON TABLE game_results IS 'Individual chess game results with PGN data';
COMMENT ON COLUMN game_results.round_number IS 'Round number for tournament games';
COMMENT ON COLUMN game_results.white_player_name IS 'Fallback name for white player if not registered';
COMMENT ON COLUMN game_results.black_player_name IS 'Fallback name for black player if not registered';

-- ============================================
-- CREATE TOURNAMENT_STANDINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tournament_standings (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  player_name VARCHAR(255),
  rank INTEGER,
  score DECIMAL(4,1), -- Swiss scoring with half points
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  tiebreak_1 DECIMAL(10,2), -- Buchholz or similar
  tiebreak_2 DECIMAL(10,2),
  prize_won DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_standings_tournament ON tournament_standings(tournament_id, rank);
CREATE INDEX IF NOT EXISTS idx_tournament_standings_user ON tournament_standings(user_id);

COMMENT ON TABLE tournament_standings IS 'Final standings for tournament participants';
COMMENT ON COLUMN tournament_standings.player_name IS 'Fallback name if user not registered';
COMMENT ON COLUMN tournament_standings.score IS 'Total score (1 for win, 0.5 for draw, 0 for loss)';
COMMENT ON COLUMN tournament_standings.tiebreak_1 IS 'Primary tiebreak (Buchholz, etc.)';

-- ============================================
-- CREATE PGN_UPLOADS TABLE
-- ============================================
-- Track uploaded PGN files

CREATE TABLE IF NOT EXISTS pgn_uploads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  game_result_id INTEGER REFERENCES game_results(id) ON DELETE CASCADE,
  file_path TEXT,
  file_size INTEGER,
  file_name VARCHAR(255),
  pgn_content TEXT NOT NULL,
  move_count INTEGER,
  white_player VARCHAR(255),
  black_player VARCHAR(255),
  result VARCHAR(50),
  date_played DATE,
  event_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pgn_uploads_user ON pgn_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_pgn_uploads_game ON pgn_uploads(game_id);
CREATE INDEX IF NOT EXISTS idx_pgn_uploads_tournament ON pgn_uploads(tournament_id);

COMMENT ON TABLE pgn_uploads IS 'Uploaded PGN files linked to games/tournaments';
COMMENT ON COLUMN pgn_uploads.pgn_content IS 'Full PGN notation text';
COMMENT ON COLUMN pgn_uploads.event_name IS 'Event name extracted from PGN';

-- ============================================
-- UPDATE GAME STATUS OPTIONS
-- ============================================
-- Add 'completed' status to games if not exists

DO $$
BEGIN
  -- Check if status column allows 'completed' value
  -- If using CHECK constraint, we'd need to drop and recreate
  -- For now, just document that 'completed' is a valid status
  NULL;
END $$;

-- ============================================
-- TRIGGERS FOR STAT TRACKING
-- ============================================

-- Update user_stats when game is completed
CREATE OR REPLACE FUNCTION increment_games_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Increment for creator
    INSERT INTO user_stats (user_id, total_games_completed)
    VALUES (NEW.creator_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_games_completed = user_stats.total_games_completed + 1,
      updated_at = NOW();

    -- Increment for all participants
    INSERT INTO user_stats (user_id, total_games_completed)
    SELECT user_id, 1
    FROM game_participants
    WHERE game_id = NEW.id AND status = 'confirmed'
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_games_completed = user_stats.total_games_completed + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_games_completed
AFTER UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION increment_games_completed();

-- Update user_stats when PGN is uploaded
CREATE OR REPLACE FUNCTION increment_pgn_uploads()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_pgns_uploaded)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_pgns_uploaded = COALESCE(user_stats.total_pgns_uploaded, 0) + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_pgn_uploads
AFTER INSERT ON pgn_uploads
FOR EACH ROW
EXECUTE FUNCTION increment_pgn_uploads();

COMMENT ON TRIGGER trigger_increment_games_completed ON games IS 'Updates user stats when game is completed';
COMMENT ON TRIGGER trigger_increment_pgn_uploads ON pgn_uploads IS 'Updates user stats when PGN is uploaded';
