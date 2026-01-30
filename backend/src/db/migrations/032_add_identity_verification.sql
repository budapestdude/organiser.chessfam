-- Add identity verification system
-- Users can verify their identity to access events and challenges

-- Add verification status to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id);

-- Create identity verification submissions table
CREATE TABLE IF NOT EXISTS identity_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected

  -- User submitted information
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  country VARCHAR(100) NOT NULL,
  id_type VARCHAR(50) NOT NULL, -- passport, drivers_license, national_id
  id_number VARCHAR(100),

  -- Document uploads (URLs to stored files)
  id_front_image TEXT NOT NULL,
  id_back_image TEXT,
  selfie_image TEXT NOT NULL,

  -- Admin review
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure one pending submission per user
  CONSTRAINT unique_pending_verification UNIQUE (user_id, status)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_users_identity_verified ON users(identity_verified);

-- Add check constraint
ALTER TABLE identity_verifications ADD CONSTRAINT identity_verifications_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add trigger to update users table when verification is approved
CREATE OR REPLACE FUNCTION update_user_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE users
    SET identity_verified = TRUE,
        identity_verified_at = NEW.reviewed_at,
        verified_by = NEW.reviewed_by
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE users
    SET identity_verified = FALSE,
        identity_verified_at = NULL,
        verified_by = NULL
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_verification_status
AFTER UPDATE OF status ON identity_verifications
FOR EACH ROW
EXECUTE FUNCTION update_user_verification_status();
