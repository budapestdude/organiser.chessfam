-- Create Tournament Reviews table
CREATE TABLE IF NOT EXISTS tournament_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reviewer_id, tournament_id) -- One review per user per tournament
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tournament_reviews_tournament_id ON tournament_reviews(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_reviews_reviewer_id ON tournament_reviews(reviewer_id);

-- Comments
COMMENT ON TABLE tournament_reviews IS 'Reviews and ratings for chess tournaments';
COMMENT ON COLUMN tournament_reviews.rating IS 'Rating from 1 to 5 stars';
