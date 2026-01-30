-- Create Favorites table (polymorphic)
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- master, venue, club, tournament, player
  item_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create Player Reviews table (for reviewing other players)
CREATE TABLE IF NOT EXISTS player_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  sportsmanship INTEGER CHECK (sportsmanship >= 1 AND sportsmanship <= 5),
  skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_id, game_id),
  CHECK (reviewer_id != reviewed_id) -- Can't review yourself
);

-- Create Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category VARCHAR(50), -- games, social, tournament, learning
  points INTEGER DEFAULT 10,
  requirement JSONB -- Flexible requirement configuration
);

-- Create User Achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create Transactions table for payments
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50), -- stripe, paypal, etc.
  payment_id VARCHAR(255), -- External payment provider ID
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(item_type, item_id);
CREATE INDEX idx_player_reviews_reviewer ON player_reviews(reviewer_id);
CREATE INDEX idx_player_reviews_reviewed ON player_reviews(reviewed_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);

-- Comments
COMMENT ON TABLE favorites IS 'User favorites for various item types';
COMMENT ON TABLE player_reviews IS 'Reviews of players by other players';
COMMENT ON TABLE achievements IS 'Available achievements/badges';
COMMENT ON TABLE user_achievements IS 'Achievements earned by users';
COMMENT ON TABLE transactions IS 'Payment transactions';

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, points, requirement) VALUES
('First Game', 'Play your first chess game', 'trophy', 'games', 10, '{"games_played": 1}'),
('Social Butterfly', 'Add 5 friends', 'users', 'social', 20, '{"friends_count": 5}'),
('Tournament Debut', 'Participate in your first tournament', 'award', 'tournament', 25, '{"tournaments_played": 1}'),
('Rising Star', 'Reach 1600 rating', 'star', 'games', 50, '{"rating": 1600}'),
('Grandmaster Journey', 'Complete 100 games', 'crown', 'games', 100, '{"games_played": 100}'),
('Reviewer', 'Write your first review', 'message-square', 'social', 15, '{"reviews_written": 1}'),
('Venue Explorer', 'Check in to 10 different venues', 'map-pin', 'social', 30, '{"venues_visited": 10}'),
('Club Member', 'Join your first club', 'home', 'social', 15, '{"clubs_joined": 1}')
ON CONFLICT (name) DO NOTHING;
