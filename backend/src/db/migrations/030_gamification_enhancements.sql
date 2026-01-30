-- Migration 030: Gamification Enhancements
-- Adds XP/level system, enhanced stats tracking, leaderboards, and new game-related achievements

-- ============================================
-- EXTEND USERS TABLE WITH XP/LEVEL SYSTEM
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);

COMMENT ON COLUMN users.xp IS 'Experience points for gamification (100 XP per level)';
COMMENT ON COLUMN users.level IS 'User level based on XP (level = floor(xp / 100) + 1)';

-- ============================================
-- EXTEND USER_STATS TABLE
-- ============================================

-- Game-specific stats
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_games_completed INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_pgns_uploaded INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_private_games INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_recurring_games INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_reviews_given INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_reviews_received INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS average_opponent_rating DECIMAL(3,2);
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_messages_sent INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_match_suggestions_accepted INTEGER DEFAULT 0;

COMMENT ON COLUMN user_stats.total_games_completed IS 'Number of games marked as completed';
COMMENT ON COLUMN user_stats.total_pgns_uploaded IS 'Number of PGN files uploaded';
COMMENT ON COLUMN user_stats.total_private_games IS 'Number of private games created';
COMMENT ON COLUMN user_stats.total_recurring_games IS 'Number of recurring game series created';
COMMENT ON COLUMN user_stats.total_reviews_given IS 'Number of post-game reviews written';
COMMENT ON COLUMN user_stats.total_reviews_received IS 'Number of reviews received from opponents';
COMMENT ON COLUMN user_stats.average_opponent_rating IS 'Average rating received from opponents (1-5)';
COMMENT ON COLUMN user_stats.total_messages_sent IS 'Number of game chat messages sent';

-- ============================================
-- LEADERBOARDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(50) NOT NULL, -- 'xp', 'games_played', 'reviews_given', 'streak', 'level'
  score INTEGER NOT NULL,
  rank INTEGER,
  period VARCHAR(20) DEFAULT 'all_time', -- 'all_time', 'monthly', 'weekly'
  period_start DATE,
  period_end DATE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique index separately to handle NULL period_start values
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboards_unique
  ON leaderboards(user_id, leaderboard_type, period, COALESCE(period_start, '1970-01-01'::date));

CREATE INDEX IF NOT EXISTS idx_leaderboards_type_score ON leaderboards(leaderboard_type, score DESC, period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(leaderboard_type, rank, period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_type ON leaderboards(user_id, leaderboard_type);

COMMENT ON TABLE leaderboards IS 'Global leaderboards for various metrics (XP, games played, streak, etc.)';
COMMENT ON COLUMN leaderboards.leaderboard_type IS 'Type of leaderboard: xp, games_played, reviews_given, streak, level';
COMMENT ON COLUMN leaderboards.score IS 'Score for this leaderboard entry (e.g., XP amount, games count, etc.)';
COMMENT ON COLUMN leaderboards.rank IS 'User rank on this leaderboard (1 = top)';
COMMENT ON COLUMN leaderboards.period IS 'Time period: all_time, monthly, weekly';

-- ============================================
-- NEW GAME-RELATED ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (achievement_key, name, description, icon, category, tier, requirement_value)
VALUES
  -- Game completion achievements
  ('game_complete_1', 'First Victory', 'Complete your first game', 'Trophy', 'games', 'bronze', 1),
  ('game_complete_10', 'Seasoned Player', 'Complete 10 games', 'Trophy', 'games', 'silver', 10),
  ('game_complete_50', 'Chess Veteran', 'Complete 50 games', 'Trophy', 'games', 'gold', 50),
  ('game_complete_100', 'Chess Master', 'Complete 100 games', 'Trophy', 'games', 'platinum', 100),

  -- PGN upload achievements
  ('pgn_upload_1', 'Record Keeper', 'Upload your first PGN', 'FileText', 'games', 'bronze', 1),
  ('pgn_upload_10', 'Game Archivist', 'Upload 10 PGNs', 'FileText', 'games', 'silver', 10),
  ('pgn_upload_50', 'Chess Historian', 'Upload 50 PGNs', 'FileText', 'games', 'gold', 50),

  -- Review achievements
  ('review_5', 'Fair Judge', 'Give 5 game reviews', 'Star', 'social', 'bronze', 5),
  ('review_25', 'Community Contributor', 'Give 25 game reviews', 'Star', 'social', 'silver', 25),
  ('review_100', 'Respected Reviewer', 'Give 100 game reviews', 'Star', 'social', 'gold', 100),

  -- Game type achievements
  ('private_game_1', 'Exclusive Host', 'Create your first private game', 'Lock', 'games', 'bronze', 1),
  ('private_game_10', 'Private Party Pro', 'Create 10 private games', 'Lock', 'games', 'silver', 10),
  ('recurring_game_1', 'Regular Organizer', 'Create your first recurring game', 'Calendar', 'games', 'silver', 1),
  ('recurring_game_5', 'Weekly Champion', 'Create 5 recurring game series', 'Calendar', 'games', 'gold', 5),

  -- Matching achievements
  ('match_accept_1', 'Match Made', 'Accept your first match suggestion', 'Users', 'social', 'bronze', 1),
  ('match_accept_10', 'Match Enthusiast', 'Accept 10 match suggestions', 'Users', 'social', 'silver', 10),
  ('match_accept_50', 'Perfect Match', 'Accept 50 match suggestions', 'Users', 'social', 'gold', 50),

  -- Chat/communication achievements
  ('messages_100', 'Chatty Chess Player', 'Send 100 game messages', 'MessageSquare', 'social', 'bronze', 100),
  ('messages_500', 'Conversationalist', 'Send 500 game messages', 'MessageSquare', 'social', 'silver', 500),

  -- Level achievements
  ('level_10', 'Rising Star', 'Reach level 10', 'Star', 'games', 'bronze', 10),
  ('level_25', 'Chess Enthusiast', 'Reach level 25', 'Star', 'games', 'silver', 25),
  ('level_50', 'Legendary Player', 'Reach level 50', 'Star', 'games', 'gold', 50),
  ('level_100', 'Chess Deity', 'Reach level 100', 'Star', 'games', 'platinum', 100)
ON CONFLICT (achievement_key) DO NOTHING;

-- ============================================
-- HELPER FUNCTION: CALCULATE USER RANK
-- ============================================

CREATE OR REPLACE FUNCTION calculate_user_rank(
  p_user_id INTEGER,
  p_leaderboard_type VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  CASE p_leaderboard_type
    WHEN 'xp' THEN
      SELECT COUNT(*) + 1 INTO user_rank
      FROM users
      WHERE xp > (SELECT xp FROM users WHERE id = p_user_id);

    WHEN 'level' THEN
      SELECT COUNT(*) + 1 INTO user_rank
      FROM users
      WHERE level > (SELECT level FROM users WHERE id = p_user_id)
         OR (level = (SELECT level FROM users WHERE id = p_user_id)
             AND xp > (SELECT xp FROM users WHERE id = p_user_id));

    WHEN 'games_played' THEN
      SELECT COUNT(*) + 1 INTO user_rank
      FROM user_stats
      WHERE total_games_completed > (
        SELECT total_games_completed FROM user_stats WHERE user_id = p_user_id
      );

    WHEN 'streak' THEN
      SELECT COUNT(*) + 1 INTO user_rank
      FROM user_stats
      WHERE consecutive_checkin_days > (
        SELECT consecutive_checkin_days FROM user_stats WHERE user_id = p_user_id
      );

    WHEN 'reviews' THEN
      SELECT COUNT(*) + 1 INTO user_rank
      FROM user_stats
      WHERE total_reviews_given > (
        SELECT total_reviews_given FROM user_stats WHERE user_id = p_user_id
      );

    ELSE
      user_rank := NULL;
  END CASE;

  RETURN user_rank;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_user_rank IS 'Calculate user''s rank on a specific leaderboard type';

-- ============================================
-- HELPER FUNCTION: UPDATE LEADERBOARD ENTRY
-- ============================================

CREATE OR REPLACE FUNCTION update_leaderboard_entry(
  p_user_id INTEGER,
  p_leaderboard_type VARCHAR(50),
  p_score INTEGER
) RETURNS VOID AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  user_rank := calculate_user_rank(p_user_id, p_leaderboard_type);

  INSERT INTO leaderboards (user_id, leaderboard_type, score, rank, period)
  VALUES (p_user_id, p_leaderboard_type, p_score, user_rank, 'all_time')
  ON CONFLICT (user_id, leaderboard_type, period, COALESCE(period_start, '1970-01-01'))
  DO UPDATE SET
    score = EXCLUDED.score,
    rank = user_rank,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_leaderboard_entry IS 'Insert or update a leaderboard entry for a user';

-- ============================================
-- CREATE INITIAL LEADERBOARD ENTRIES
-- ============================================

-- Generate initial leaderboard entries for existing users
DO $$
BEGIN
  -- XP leaderboard
  INSERT INTO leaderboards (user_id, leaderboard_type, score, rank, period)
  SELECT
    id,
    'xp',
    COALESCE(xp, 0),
    ROW_NUMBER() OVER (ORDER BY COALESCE(xp, 0) DESC),
    'all_time'
  FROM users
  ON CONFLICT DO NOTHING;

  -- Level leaderboard
  INSERT INTO leaderboards (user_id, leaderboard_type, score, rank, period)
  SELECT
    id,
    'level',
    COALESCE(level, 1),
    ROW_NUMBER() OVER (ORDER BY COALESCE(level, 1) DESC, COALESCE(xp, 0) DESC),
    'all_time'
  FROM users
  ON CONFLICT DO NOTHING;

  -- Games played leaderboard (only for users with stats)
  INSERT INTO leaderboards (user_id, leaderboard_type, score, rank, period)
  SELECT
    us.user_id,
    'games_played',
    COALESCE(us.total_games_completed, 0),
    ROW_NUMBER() OVER (ORDER BY COALESCE(us.total_games_completed, 0) DESC),
    'all_time'
  FROM user_stats us
  ON CONFLICT DO NOTHING;
END $$;
