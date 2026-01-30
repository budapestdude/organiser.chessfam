-- Add ban fields to users table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = true;

COMMENT ON COLUMN users.is_banned IS 'Whether user is banned from the platform';
COMMENT ON COLUMN users.ban_reason IS 'Reason for the ban (set by admin)';
