-- Create Master Applications table for users applying to become masters
CREATE TABLE IF NOT EXISTS master_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Profile information
  title VARCHAR(100) NOT NULL, -- GM, IM, FM, NM, CM, WGM, WIM, WFM, WNM, WCM
  fide_id VARCHAR(50),
  lichess_username VARCHAR(100),
  chesscom_username VARCHAR(100),
  peak_rating INTEGER NOT NULL,
  current_rating INTEGER NOT NULL,

  -- Pricing
  price_bullet DECIMAL(10, 2),
  price_blitz DECIMAL(10, 2),
  price_rapid DECIMAL(10, 2),
  price_classical DECIMAL(10, 2),

  -- Bio and verification
  bio TEXT,
  specialties TEXT[], -- Array of specialties like 'Opening Theory', 'Endgames', 'Tactics'
  experience_years INTEGER,
  languages TEXT[], -- Array of languages spoken

  -- Verification documents (URLs to uploaded files)
  verification_document TEXT,
  profile_image TEXT,

  -- Application status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Only one active application per user
  UNIQUE(user_id)
);

-- Link approved masters to their user accounts
ALTER TABLE masters ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE masters ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE masters ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE masters ADD COLUMN IF NOT EXISTS fide_id VARCHAR(50);
ALTER TABLE masters ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add is_master flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS master_id INTEGER REFERENCES masters(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_master_applications_user_id ON master_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_master_applications_status ON master_applications(status);
CREATE INDEX IF NOT EXISTS idx_masters_user_id ON masters(user_id);

-- Comments
COMMENT ON TABLE master_applications IS 'Applications from users to become chess masters/instructors';
COMMENT ON COLUMN master_applications.title IS 'Chess title (GM, IM, FM, NM, etc.)';
COMMENT ON COLUMN master_applications.status IS 'Application status: pending, approved, rejected';
