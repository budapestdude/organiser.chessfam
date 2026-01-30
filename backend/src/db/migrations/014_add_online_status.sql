-- Add last_active_at column to users table for online status tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for efficient queries on online users
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

-- Function to check if user is online (active within last 5 minutes)
-- This can be used in queries: SELECT *, is_online(last_active_at) as online FROM users
CREATE OR REPLACE FUNCTION is_online(last_active TIMESTAMP) RETURNS BOOLEAN AS $$
BEGIN
  RETURN last_active > CURRENT_TIMESTAMP - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;
