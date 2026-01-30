-- Add extended profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Chess-specific profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS fide_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS lichess_username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS chesscom_username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_title VARCHAR(20); -- GM, IM, FM, NM, CM, WGM, etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS peak_rating INTEGER;

-- Preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_time_control VARCHAR(50); -- bullet, blitz, rapid, classical
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for_games BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for_students BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for_coach BOOLEAN DEFAULT false;

-- Social/visibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public'; -- public, members, private
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_rating BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_looking_for_games ON users(looking_for_games);
CREATE INDEX IF NOT EXISTS idx_users_chess_title ON users(chess_title);

COMMENT ON COLUMN users.bio IS 'User biography/about me text';
COMMENT ON COLUMN users.chess_title IS 'FIDE or national chess title (GM, IM, FM, etc.)';
COMMENT ON COLUMN users.preferred_time_control IS 'Preferred game time control';
COMMENT ON COLUMN users.profile_visibility IS 'Who can see the full profile: public, members, private';
