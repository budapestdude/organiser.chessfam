-- Create venue_submissions table for users to register their venues
CREATE TABLE IF NOT EXISTS venue_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  venue_name VARCHAR(255) NOT NULL,
  venue_type VARCHAR(50) NOT NULL CHECK (venue_type IN ('park', 'cafe', 'club', 'community_center', 'other')),
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  description TEXT,
  amenities TEXT[], -- Array of amenities
  opening_hours TEXT,
  image_url VARCHAR(500),
  contact_person_name VARCHAR(255),
  contact_person_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venue_submissions_user_id ON venue_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_submissions_status ON venue_submissions(status);
CREATE INDEX IF NOT EXISTS idx_venue_submissions_venue_type ON venue_submissions(venue_type);
CREATE INDEX IF NOT EXISTS idx_venue_submissions_city ON venue_submissions(city);
