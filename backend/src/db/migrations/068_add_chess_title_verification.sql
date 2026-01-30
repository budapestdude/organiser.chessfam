-- Migration 068: Chess Title Verification System
-- Adds support for verifying FIDE chess titles with certificate upload and admin review

-- Add chess title verification status to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS chess_title_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS chess_title_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS chess_title_verified_by INTEGER REFERENCES users(id);

-- Create chess title verification submissions table
CREATE TABLE IF NOT EXISTS chess_title_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',

  -- Claimed title information
  claimed_title VARCHAR(20) NOT NULL,
  fide_id VARCHAR(50),

  -- Certificate upload
  certificate_image TEXT NOT NULL,

  -- Admin review
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_pending_chess_title_verification
    UNIQUE (user_id, status),
  CONSTRAINT chess_title_verifications_title_check
    CHECK (claimed_title IN ('GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM')),
  CONSTRAINT chess_title_verifications_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'revoked'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chess_title_verifications_user_id ON chess_title_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chess_title_verifications_status ON chess_title_verifications(status);
CREATE INDEX IF NOT EXISTS idx_users_chess_title_verified ON users(chess_title_verified);

-- Trigger to update users table when verification is approved/rejected
CREATE OR REPLACE FUNCTION update_user_chess_title_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE users
    SET chess_title = NEW.claimed_title,
        chess_title_verified = TRUE,
        chess_title_verified_at = NEW.reviewed_at,
        chess_title_verified_by = NEW.reviewed_by
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE users
    SET chess_title_verified = FALSE,
        chess_title_verified_at = NULL,
        chess_title_verified_by = NULL
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'revoked' THEN
    UPDATE users
    SET chess_title_verified = FALSE,
        chess_title_verified_at = NULL,
        chess_title_verified_by = NULL
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chess_title_status
AFTER UPDATE OF status ON chess_title_verifications
FOR EACH ROW
EXECUTE FUNCTION update_user_chess_title_status();
