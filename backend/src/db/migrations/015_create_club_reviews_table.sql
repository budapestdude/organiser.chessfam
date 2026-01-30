-- Create Club Reviews table
CREATE TABLE IF NOT EXISTS club_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reviewer_id, club_id) -- One review per user per club
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_club_reviews_club_id ON club_reviews(club_id);
CREATE INDEX IF NOT EXISTS idx_club_reviews_reviewer_id ON club_reviews(reviewer_id);

-- Comments
COMMENT ON TABLE club_reviews IS 'Reviews and ratings for chess clubs';
COMMENT ON COLUMN club_reviews.rating IS 'Rating from 1 to 5 stars';
