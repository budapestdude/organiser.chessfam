-- Create Venues table
CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  coordinates JSONB, -- {lat, lng}
  phone VARCHAR(50),
  email VARCHAR(255),
  website TEXT,
  images TEXT[], -- Array of image URLs
  amenities TEXT[], -- wifi, parking, cafe, etc.
  hours JSONB, -- Operating hours by day
  capacity INTEGER,
  price_range VARCHAR(50), -- $, $$, $$$
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  verified BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Venue Reviews table
CREATE TABLE IF NOT EXISTS venue_reviews (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  visit_date DATE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(venue_id, user_id)
);

-- Create Check-ins table
CREATE TABLE IF NOT EXISTS checkins (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP DEFAULT NOW(),
  checked_out_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' -- active, completed
);

-- Indexes for performance
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_owner_id ON venues(owner_id);
CREATE INDEX idx_venue_reviews_venue_id ON venue_reviews(venue_id);
CREATE INDEX idx_venue_reviews_user_id ON venue_reviews(user_id);
CREATE INDEX idx_checkins_venue_id ON checkins(venue_id);
CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_status ON checkins(status);

-- Comments
COMMENT ON TABLE venues IS 'Chess venues and clubs locations';
COMMENT ON TABLE venue_reviews IS 'User reviews for venues';
COMMENT ON TABLE checkins IS 'User check-ins at venues';
