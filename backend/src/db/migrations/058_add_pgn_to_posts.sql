-- Add PGN field to posts table for chess game notation
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pgn TEXT;

-- Add index for posts with PGN
CREATE INDEX IF NOT EXISTS idx_posts_pgn ON posts(id) WHERE pgn IS NOT NULL;

COMMENT ON COLUMN posts.pgn IS 'Chess game in PGN (Portable Game Notation) format';
