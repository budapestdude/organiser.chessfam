-- ============================================
-- Chess-Centric Blog Features Migration
-- ============================================

-- Add chess category and difficulty level to blogs
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS chess_category VARCHAR(50);
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20);

ALTER TABLE blogs ADD CONSTRAINT valid_chess_category
  CHECK (chess_category IS NULL OR chess_category IN (
    'opening-theory', 'middlegame', 'endgame', 'tactics',
    'strategy', 'game-analysis', 'tournament-report', 'training'
  ));

ALTER TABLE blogs ADD CONSTRAINT valid_difficulty_level
  CHECK (difficulty_level IS NULL OR difficulty_level IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  ));

CREATE INDEX idx_blogs_chess_category ON blogs(chess_category) WHERE chess_category IS NOT NULL;
CREATE INDEX idx_blogs_difficulty ON blogs(difficulty_level) WHERE difficulty_level IS NOT NULL;

COMMENT ON COLUMN blogs.chess_category IS 'Chess content category for filtering and organization';
COMMENT ON COLUMN blogs.difficulty_level IS 'Target skill level for the article content';

-- ============================================
-- Blog Chess Games (for embedded PGN)
-- ============================================
CREATE TABLE IF NOT EXISTS blog_chess_games (
  id SERIAL PRIMARY KEY,
  blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  pgn TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT pgn_not_empty CHECK (LENGTH(pgn) > 0),
  CONSTRAINT reasonable_pgn_size CHECK (LENGTH(pgn) < 100000)
);

CREATE INDEX idx_blog_chess_games_blog ON blog_chess_games(blog_id);

COMMENT ON TABLE blog_chess_games IS 'PGN chess games embedded in blog articles';
COMMENT ON COLUMN blog_chess_games.order_index IS 'Display order for multiple games in article';

-- ============================================
-- Blog Chess Puzzles
-- ============================================
CREATE TABLE IF NOT EXISTS blog_chess_puzzles (
  id SERIAL PRIMARY KEY,
  blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  fen TEXT NOT NULL,
  solution_moves TEXT[] NOT NULL,
  hint TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fen_not_empty CHECK (LENGTH(fen) > 0),
  CONSTRAINT has_solution CHECK (array_length(solution_moves, 1) > 0)
);

CREATE INDEX idx_blog_chess_puzzles_blog ON blog_chess_puzzles(blog_id);

COMMENT ON TABLE blog_chess_puzzles IS 'Interactive chess puzzles within blog articles';
COMMENT ON COLUMN blog_chess_puzzles.solution_moves IS 'Array of correct moves in SAN notation';

-- ============================================
-- Blog Linked Entities (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS blog_linked_entities (
  id SERIAL PRIMARY KEY,
  blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL,
  entity_id INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (entity_type IN ('tournament', 'club', 'venue', 'community'))
);

CREATE INDEX idx_blog_linked_entities_blog ON blog_linked_entities(blog_id);
CREATE INDEX idx_blog_linked_entities_entity ON blog_linked_entities(entity_type, entity_id);

COMMENT ON TABLE blog_linked_entities IS 'Links blogs to platform entities (tournaments, clubs, etc.)';
