-- Migration 078: Create Professionals System
-- Comprehensive marketplace for chess professionals

-- 1. Create professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Professional Type
  professional_type VARCHAR(50) NOT NULL CHECK (professional_type IN (
    'coach', 'arbiter', 'photographer', 'videographer',
    'analyst', 'commentator', 'influencer', 'writer',
    'dgt_operator', 'programmer', 'editor', 'designer', 'producer'
  )),

  -- Basic Profile
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_image TEXT,

  -- Credentials (type-specific JSONB)
  credentials JSONB,
  verification_documents TEXT[],

  -- Experience
  experience_years INTEGER,
  specialties TEXT[],
  languages TEXT[],

  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  remote_available BOOLEAN DEFAULT true,
  onsite_available BOOLEAN DEFAULT false,

  -- Status
  available BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,

  -- Stats
  total_bookings INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for professionals table
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_type ON professionals(professional_type);
CREATE INDEX IF NOT EXISTS idx_professionals_verified ON professionals(verified);
CREATE INDEX IF NOT EXISTS idx_professionals_available ON professionals(available);
CREATE INDEX IF NOT EXISTS idx_professionals_featured ON professionals(featured);
CREATE INDEX IF NOT EXISTS idx_professionals_country_city ON professionals(country, city);

-- 2. Create professional_services table
CREATE TABLE IF NOT EXISTS professional_services (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  service_name VARCHAR(255) NOT NULL,
  service_description TEXT,

  -- Pricing Model
  pricing_model VARCHAR(50) NOT NULL CHECK (pricing_model IN (
    'hourly', 'per_event', 'per_day', 'custom_quote'
  )),

  base_price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',

  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for professional_services table
CREATE INDEX IF NOT EXISTS idx_professional_services_professional_id ON professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_pricing_model ON professional_services(pricing_model);

-- 3. Create professional_applications table
CREATE TABLE IF NOT EXISTS professional_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_type VARCHAR(50) NOT NULL,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_image TEXT,

  -- Type-specific data (JSONB for flexibility)
  type_specific_data JSONB NOT NULL,

  -- Credentials
  verification_documents TEXT[],
  portfolio_urls TEXT[],

  -- Experience
  experience_years INTEGER,
  specialties TEXT[],
  languages TEXT[],

  -- Proposed Services
  proposed_services JSONB[],

  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  remote_available BOOLEAN DEFAULT true,

  -- Application Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  admin_notes TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_user_professional_type UNIQUE(user_id, professional_type)
);

-- Create indexes for professional_applications table
CREATE INDEX IF NOT EXISTS idx_professional_applications_user_id ON professional_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_applications_status ON professional_applications(status);
CREATE INDEX IF NOT EXISTS idx_professional_applications_type ON professional_applications(professional_type);

-- 4. Create professional_bookings table
CREATE TABLE IF NOT EXISTS professional_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES professional_services(id),

  service_name VARCHAR(255) NOT NULL,
  pricing_model VARCHAR(50) NOT NULL,

  -- Date & Time
  booking_date DATE,
  booking_time TIME,
  duration_hours INTEGER,

  -- Location
  location_type VARCHAR(20) CHECK (location_type IN ('online', 'onsite')),

  -- Pricing
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2) NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'quote_requested', 'confirmed', 'completed', 'cancelled'
  )),

  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for professional_bookings table
CREATE INDEX IF NOT EXISTS idx_professional_bookings_user_id ON professional_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_bookings_professional_id ON professional_bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_bookings_status ON professional_bookings(status);
CREATE INDEX IF NOT EXISTS idx_professional_bookings_booking_date ON professional_bookings(booking_date);

-- 5. Create professional_reviews table
CREATE TABLE IF NOT EXISTS professional_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES professional_bookings(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_booking_review UNIQUE(booking_id)
);

-- Create indexes for professional_reviews table
CREATE INDEX IF NOT EXISTS idx_professional_reviews_user_id ON professional_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_professional_id ON professional_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_booking_id ON professional_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_created_at ON professional_reviews(created_at DESC);

-- 6. Extend users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_id INTEGER REFERENCES professionals(id);

-- 7. Extend masters table (for tournament/league availability)
ALTER TABLE masters ADD COLUMN IF NOT EXISTS available_for_events BOOLEAN DEFAULT false;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS event_types TEXT[];
ALTER TABLE masters ADD COLUMN IF NOT EXISTS event_rate_per_day DECIMAL(10,2);
ALTER TABLE masters ADD COLUMN IF NOT EXISTS event_notes TEXT;

COMMENT ON TABLE professionals IS 'Chess professionals marketplace - coaches, arbiters, photographers, etc.';
COMMENT ON TABLE professional_services IS 'Services offered by professionals with flexible pricing models';
COMMENT ON TABLE professional_applications IS 'Applications to become a professional - requires admin approval';
COMMENT ON TABLE professional_bookings IS 'Bookings made by users with professionals';
COMMENT ON TABLE professional_reviews IS 'Reviews for professionals tied to completed bookings';
