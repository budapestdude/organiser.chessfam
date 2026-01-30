-- ============================================
-- ADD FAVORITE SECTIONS TO USER PROFILES
-- ============================================
-- Add fields for favorite player, tournament, and opening

ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_player VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_tournament VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_opening VARCHAR(255);

-- Add indexes for searching by favorites
CREATE INDEX IF NOT EXISTS idx_users_favorite_player ON users(favorite_player) WHERE favorite_player IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_favorite_tournament ON users(favorite_tournament) WHERE favorite_tournament IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_favorite_opening ON users(favorite_opening) WHERE favorite_opening IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.favorite_player IS 'User''s favorite chess player (e.g., Magnus Carlsen, Garry Kasparov)';
COMMENT ON COLUMN users.favorite_tournament IS 'User''s favorite chess tournament (e.g., World Championship, Tata Steel)';
COMMENT ON COLUMN users.favorite_opening IS 'User''s favorite chess opening (e.g., Sicilian Defense, King''s Gambit)';
