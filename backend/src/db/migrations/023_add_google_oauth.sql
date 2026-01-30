-- Add Google OAuth support to users table
-- Migration: 023_add_google_oauth.sql

-- Add google_id column for Google OAuth users
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Add auth_provider column to track how user signed up
-- 'local' = email/password, 'google' = Google OAuth, 'both' = linked both
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';

-- Make password_hash nullable for OAuth-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add index for google_id lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Update existing users to have auth_provider = 'local'
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL AND password_hash IS NOT NULL;
