-- Create player reviews table
CREATE TABLE IF NOT EXISTS player_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  badges TEXT[], -- Array of compliment badges like 'friendly', 'skilled', 'punctual', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reviewer_id, player_id) -- One review per reviewer-player pair
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_reviews_player_id ON player_reviews(player_id);
CREATE INDEX IF NOT EXISTS idx_player_reviews_reviewer_id ON player_reviews(reviewer_id);
