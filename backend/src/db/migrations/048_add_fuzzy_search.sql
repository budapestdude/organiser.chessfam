-- Enable pg_trgm extension for fuzzy search (trigram similarity)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fast fuzzy text search on communities
CREATE INDEX IF NOT EXISTS communities_name_trgm_idx ON communities USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS communities_description_trgm_idx ON communities USING GIN (description gin_trgm_ops);

-- Create GIN indexes for fast fuzzy text search on clubs
CREATE INDEX IF NOT EXISTS clubs_name_trgm_idx ON clubs USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS clubs_description_trgm_idx ON clubs USING GIN (description gin_trgm_ops);

-- Create GIN indexes for fast fuzzy text search on tournaments
CREATE INDEX IF NOT EXISTS tournaments_name_trgm_idx ON tournaments USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS tournaments_description_trgm_idx ON tournaments USING GIN (description gin_trgm_ops);

-- Create GIN indexes for fast fuzzy text search on venues
CREATE INDEX IF NOT EXISTS venues_name_trgm_idx ON venues USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS venues_description_trgm_idx ON venues USING GIN (description gin_trgm_ops);

-- Notes:
-- - pg_trgm extension provides similarity functions for fuzzy matching
-- - similarity(text1, text2) returns 0-1 indicating overall similarity
-- - word_similarity(text1, text2) returns 0-1 for partial word matching
-- - Very generous thresholds used:
--   * similarity() > 0.1 (catches typos and variations)
--   * word_similarity() > 0.2 (for partial matches)
--   * Space-insensitive: "four corners" matches "fourcorner"
-- - GIN indexes make fuzzy search very fast even on large tables
