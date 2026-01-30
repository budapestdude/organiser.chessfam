-- Migration 029: Game System Enhancements
-- Adds support for: private games, recurring games, waitlist, chat, PGN, reviews, notifications, matching

-- ============================================
-- EXTEND GAMES TABLE
-- ============================================

-- Private games functionality
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(64) UNIQUE;

-- Recurring games functionality
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(50); -- 'weekly', 'biweekly', 'monthly'
ALTER TABLE games ADD COLUMN IF NOT EXISTS recurrence_day INTEGER; -- day of week (0-6) or day of month (1-31)
ALTER TABLE games ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS parent_game_id INTEGER REFERENCES games(id) ON DELETE SET NULL;

-- Game completion tracking
ALTER TABLE games ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS white_player_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS black_player_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE games ADD COLUMN IF NOT EXISTS result VARCHAR(20); -- 'white_win', 'black_win', 'draw', 'ongoing'

-- Notifications and matching
ALTER TABLE games ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN IF NOT EXISTS min_rating INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_rating INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_venue_lat ON games(venue_lat) WHERE venue_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_venue_lng ON games(venue_lng) WHERE venue_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_location ON games(venue_lat, venue_lng) WHERE venue_lat IS NOT NULL AND venue_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_private ON games(is_private);
CREATE INDEX IF NOT EXISTS idx_games_recurring ON games(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_parent ON games(parent_game_id) WHERE parent_game_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_date_status ON games(game_date, status);
CREATE INDEX IF NOT EXISTS idx_games_rating_range ON games(min_rating, max_rating) WHERE min_rating IS NOT NULL OR max_rating IS NOT NULL;

-- Add comments
COMMENT ON COLUMN games.is_private IS 'Private games require invitation link to join';
COMMENT ON COLUMN games.invitation_token IS 'Unique token for private game invitations';
COMMENT ON COLUMN games.is_recurring IS 'Indicates if game repeats on a schedule';
COMMENT ON COLUMN games.recurrence_pattern IS 'Recurrence pattern: weekly, biweekly, monthly';
COMMENT ON COLUMN games.recurrence_day IS 'Day of week (0-6) for weekly/biweekly or day of month (1-31) for monthly';
COMMENT ON COLUMN games.recurrence_end_date IS 'When recurring games should stop being created';
COMMENT ON COLUMN games.parent_game_id IS 'References the original recurring game this instance was created from';
COMMENT ON COLUMN games.result IS 'Game result: white_win, black_win, draw, ongoing';
COMMENT ON COLUMN games.reminder_sent IS 'Tracks if reminder notifications have been scheduled for this game';

-- ============================================
-- GAME WAITLIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS game_waitlist (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'waiting', -- 'waiting', 'invited', 'expired'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_waitlist_game_id ON game_waitlist(game_id);
CREATE INDEX IF NOT EXISTS idx_game_waitlist_user_id ON game_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_game_waitlist_status ON game_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_game_waitlist_joined_at ON game_waitlist(game_id, joined_at);

COMMENT ON TABLE game_waitlist IS 'Users waiting for spots in full games';
COMMENT ON COLUMN game_waitlist.notified IS 'Whether user has been notified of an available spot';
COMMENT ON COLUMN game_waitlist.status IS 'Waitlist status: waiting (in queue), invited (spot available), expired (game started/cancelled)';

-- ============================================
-- GAME CHAT MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS game_messages (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_game_messages_game_id ON game_messages(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_messages_user_id ON game_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_game_messages_created_at ON game_messages(created_at DESC);

COMMENT ON TABLE game_messages IS 'Chat messages for game participants';
COMMENT ON COLUMN game_messages.deleted IS 'Soft delete flag - deleted messages are hidden but not removed';

-- ============================================
-- GAME PGN STORAGE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS game_pgn (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pgn_data TEXT NOT NULL,
  move_count INTEGER,
  opening_name VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_pgn_game_id ON game_pgn(game_id);
CREATE INDEX IF NOT EXISTS idx_game_pgn_uploaded_by ON game_pgn(uploaded_by);

COMMENT ON TABLE game_pgn IS 'PGN (Portable Game Notation) storage for completed games';
COMMENT ON COLUMN game_pgn.move_count IS 'Number of moves in the game (parsed from PGN)';
COMMENT ON COLUMN game_pgn.opening_name IS 'Opening name (parsed from PGN metadata)';

-- ============================================
-- GAME REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS game_reviews (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  opponent_rating INTEGER CHECK (opponent_rating >= 1 AND opponent_rating <= 5),
  game_quality_rating INTEGER CHECK (game_quality_rating >= 1 AND game_quality_rating <= 5),
  comment TEXT,
  badges TEXT[], -- Array of compliment badges
  reported BOOLEAN DEFAULT FALSE,
  report_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_game_reviews_game_id ON game_reviews(game_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_reviewer_id ON game_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_opponent_id ON game_reviews(opponent_id) WHERE opponent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_reviews_reported ON game_reviews(reported) WHERE reported = TRUE;

COMMENT ON TABLE game_reviews IS 'Post-game reviews and opponent ratings';
COMMENT ON COLUMN game_reviews.opponent_rating IS 'Rating of opponent behavior (1-5 stars)';
COMMENT ON COLUMN game_reviews.game_quality_rating IS 'Rating of overall game quality (1-5 stars)';
COMMENT ON COLUMN game_reviews.badges IS 'Array of compliment badges: good_sport, punctual, skilled, friendly, etc.';
COMMENT ON COLUMN game_reviews.reported IS 'Flag for problematic behavior (no-shows, abuse)';

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_game_reminders BOOLEAN DEFAULT TRUE,
  email_game_updates BOOLEAN DEFAULT TRUE,
  email_match_suggestions BOOLEAN DEFAULT TRUE,
  push_game_reminders BOOLEAN DEFAULT TRUE,
  push_game_updates BOOLEAN DEFAULT TRUE,
  push_match_suggestions BOOLEAN DEFAULT TRUE,
  reminder_hours_before INTEGER DEFAULT 24, -- hours before game to send reminder
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE notification_preferences IS 'User notification settings for games';
COMMENT ON COLUMN notification_preferences.reminder_hours_before IS 'How many hours before a game to send reminders (default: 24)';

-- ============================================
-- MATCH PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS match_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_time_controls TEXT[], -- ['blitz', 'rapid', 'classical']
  preferred_player_levels TEXT[], -- ['beginner', 'intermediate', 'advanced']
  max_distance_km INTEGER DEFAULT 50,
  min_rating_diff INTEGER DEFAULT -400,
  max_rating_diff INTEGER DEFAULT 400,
  preferred_days TEXT[], -- ['monday', 'tuesday', ...]
  preferred_times TEXT[], -- ['morning', 'afternoon', 'evening']
  auto_match BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_preferences_auto_match ON match_preferences(auto_match) WHERE auto_match = TRUE;

COMMENT ON TABLE match_preferences IS 'User preferences for smart matching algorithm';
COMMENT ON COLUMN match_preferences.max_distance_km IS 'Maximum distance for game venue in kilometers';
COMMENT ON COLUMN match_preferences.auto_match IS 'Allow automatic matching without manual approval';

-- ============================================
-- SCHEDULED NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'reminder', 'game_update', 'waitlist_spot', 'match_suggestion'
  scheduled_for TIMESTAMP NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  email_sent BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_game_id ON scheduled_notifications(game_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for) WHERE sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent, scheduled_for);

COMMENT ON TABLE scheduled_notifications IS 'Queue for scheduled game notifications (processed by cron jobs)';
COMMENT ON COLUMN scheduled_notifications.notification_type IS 'Type of notification: reminder, game_update, waitlist_spot, match_suggestion';
COMMENT ON COLUMN scheduled_notifications.email_sent IS 'Whether email notification was successfully sent';
COMMENT ON COLUMN scheduled_notifications.push_sent IS 'Whether push notification was successfully sent';
