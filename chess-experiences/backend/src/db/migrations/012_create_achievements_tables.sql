-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  achievement_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Create user_stats table to track various statistics
CREATE TABLE IF NOT EXISTS user_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_checkins INTEGER DEFAULT 0,
  unique_venues_visited INTEGER DEFAULT 0,
  total_games_created INTEGER DEFAULT 0,
  total_games_joined INTEGER DEFAULT 0,
  total_bookings_made INTEGER DEFAULT 0,
  unique_players_met INTEGER DEFAULT 0,
  consecutive_checkin_days INTEGER DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial achievements
INSERT INTO achievements (achievement_key, name, description, icon, category, tier, requirement_value)
VALUES
  -- Check-in achievements
  ('first_checkin', 'First Steps', 'Check in to your first venue', 'MapPin', 'checkin', 'bronze', 1),
  ('checkin_5', 'Regular Visitor', 'Check in to venues 5 times', 'MapPin', 'checkin', 'silver', 5),
  ('checkin_25', 'Venue Explorer', 'Check in to venues 25 times', 'MapPin', 'checkin', 'gold', 25),
  ('checkin_100', 'Chess Nomad', 'Check in to venues 100 times', 'MapPin', 'checkin', 'platinum', 100),

  -- Unique venue achievements
  ('venues_3', 'Venue Hopper', 'Visit 3 different venues', 'Building', 'exploration', 'bronze', 3),
  ('venues_10', 'Location Scout', 'Visit 10 different venues', 'Building', 'exploration', 'silver', 10),
  ('venues_25', 'World Traveler', 'Visit 25 different venues', 'Building', 'exploration', 'gold', 25),

  -- Game achievements
  ('game_create_1', 'Game Organizer', 'Create your first game', 'Gamepad2', 'games', 'bronze', 1),
  ('game_create_10', 'Community Builder', 'Create 10 games', 'Gamepad2', 'games', 'silver', 10),
  ('game_join_5', 'Team Player', 'Join 5 games', 'Users', 'games', 'silver', 5),
  ('game_join_25', 'Social Butterfly', 'Join 25 games', 'Users', 'games', 'gold', 25),

  -- Social achievements
  ('players_5', 'Making Friends', 'Meet 5 different players', 'Users', 'social', 'bronze', 5),
  ('players_20', 'Social Chess Master', 'Meet 20 different players', 'Users', 'social', 'silver', 20),
  ('players_50', 'Chess Celebrity', 'Meet 50 different players', 'Users', 'social', 'gold', 50),

  -- Booking achievements
  ('booking_1', 'First Lesson', 'Book your first master session', 'GraduationCap', 'learning', 'bronze', 1),
  ('booking_5', 'Dedicated Student', 'Book 5 master sessions', 'GraduationCap', 'learning', 'silver', 5),

  -- Streak achievements
  ('streak_3', 'On a Roll', 'Check in 3 days in a row', 'Flame', 'streak', 'bronze', 3),
  ('streak_7', 'Week Warrior', 'Check in 7 days in a row', 'Flame', 'streak', 'silver', 7),
  ('streak_30', 'Unstoppable', 'Check in 30 days in a row', 'Flame', 'streak', 'gold', 30)
ON CONFLICT (achievement_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at) WHERE unlocked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
