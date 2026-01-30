-- Create analytics events table for conversion and user flow tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL, -- 'page_view', 'conversion', 'user_action', 'error'
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  anonymous_id VARCHAR(100), -- For tracking before login

  -- Event details
  properties JSONB DEFAULT '{}',

  -- Context
  page_url TEXT,
  page_referrer TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Create conversion funnels table
CREATE TABLE IF NOT EXISTS conversion_funnels (
  id SERIAL PRIMARY KEY,
  funnel_name VARCHAR(100) NOT NULL,
  funnel_steps JSONB NOT NULL, -- Array of step names
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed default conversion funnels
INSERT INTO conversion_funnels (funnel_name, funnel_steps, description) VALUES
('user_signup', '["visit_homepage", "view_signup_page", "submit_signup", "verify_email", "complete_profile"]', 'User registration funnel'),
('tournament_booking', '["view_tournaments_list", "view_tournament_detail", "click_register", "submit_payment", "booking_confirmed"]', 'Tournament registration and payment funnel'),
('club_membership', '["view_clubs_list", "view_club_detail", "click_join", "submit_payment", "membership_confirmed"]', 'Club membership signup funnel'),
('master_booking', '["view_masters_list", "view_master_detail", "click_book", "submit_payment", "booking_confirmed"]', 'Master session booking funnel'),
('venue_submission', '["view_locations", "click_submit_venue", "fill_venue_form", "submit_venue", "venue_approved"]', 'Venue submission funnel'),
('game_creation', '["view_games", "click_create_game", "fill_game_details", "submit_game", "game_started"]', 'Game creation funnel')
ON CONFLICT DO NOTHING;

-- Create user sessions table for tracking user journeys
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id VARCHAR(100),

  -- Session metadata
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Entry and exit
  entry_url TEXT,
  exit_url TEXT,
  entry_referrer TEXT,

  -- Device info
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(100),
  os VARCHAR(100),

  -- Session stats
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

COMMENT ON TABLE analytics_events IS 'Tracks all user events for analytics, conversions, and user flow analysis';
COMMENT ON TABLE conversion_funnels IS 'Defines conversion funnels to track multi-step user journeys';
COMMENT ON TABLE user_sessions IS 'Tracks user sessions for journey analysis and engagement metrics';
