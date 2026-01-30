-- Migration: Create hashtag system for posts
-- Description: Adds hashtag support to posts table and creates hashtags tracking table

-- Add hashtags array to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';

-- Create index for hashtag searches (GIN index for array contains operations)
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);

-- Create hashtags table to track trending tags
CREATE TABLE IF NOT EXISTS hashtags (
  id SERIAL PRIMARY KEY,
  tag VARCHAR(100) NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups and sorting
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_last_used ON hashtags(last_used_at DESC);

-- Function to extract hashtags from text
CREATE OR REPLACE FUNCTION extract_hashtags(text_content TEXT)
RETURNS TEXT[] AS $$
DECLARE
  hashtags TEXT[];
BEGIN
  -- Extract all words starting with # (hashtags)
  -- Remove # prefix, convert to lowercase, and return unique values
  SELECT ARRAY_AGG(DISTINCT LOWER(SUBSTRING(match FROM 2)))
  INTO hashtags
  FROM regexp_matches(text_content, '#([a-zA-Z0-9_]+)', 'g') AS match;

  RETURN COALESCE(hashtags, '{}');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update hashtag usage counts
CREATE OR REPLACE FUNCTION update_hashtag_counts()
RETURNS TRIGGER AS $$
DECLARE
  tag TEXT;
BEGIN
  -- Handle INSERT or UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Update counts for new hashtags
    FOREACH tag IN ARRAY NEW.hashtags
    LOOP
      INSERT INTO hashtags (tag, usage_count, last_used_at)
      VALUES (LOWER(tag), 1, NOW())
      ON CONFLICT (tag) DO UPDATE
      SET usage_count = hashtags.usage_count + 1,
          last_used_at = NOW(),
          updated_at = NOW();
    END LOOP;
  END IF;

  -- Handle DELETE or UPDATE (decrement old hashtags)
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    FOREACH tag IN ARRAY OLD.hashtags
    LOOP
      -- Only decrement if tag is not in new hashtags (for updates)
      IF (TG_OP = 'DELETE' OR NOT (tag = ANY(NEW.hashtags))) THEN
        UPDATE hashtags
        SET usage_count = GREATEST(usage_count - 1, 0),
            updated_at = NOW()
        WHERE tag = LOWER(tag);

        -- Delete hashtag if usage count reaches 0
        DELETE FROM hashtags WHERE tag = LOWER(tag) AND usage_count = 0;
      END IF;
    END LOOP;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update hashtag counts
DROP TRIGGER IF EXISTS update_post_hashtags ON posts;
CREATE TRIGGER update_post_hashtags
  AFTER INSERT OR UPDATE OF hashtags OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_hashtag_counts();

-- Function to automatically extract and set hashtags on post insert/update
CREATE OR REPLACE FUNCTION auto_extract_hashtags()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract hashtags from content and merge with manually set hashtags
  NEW.hashtags := ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(extract_hashtags(NEW.content), '{}') || COALESCE(NEW.hashtags, '{}')
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-extract hashtags before insert/update
DROP TRIGGER IF EXISTS auto_extract_post_hashtags ON posts;
CREATE TRIGGER auto_extract_post_hashtags
  BEFORE INSERT OR UPDATE OF content, hashtags ON posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_extract_hashtags();

-- Backfill existing posts with hashtags from their content
UPDATE posts
SET hashtags = extract_hashtags(content)
WHERE content IS NOT NULL
  AND (hashtags IS NULL OR hashtags = '{}');

-- Create view for trending hashtags (last 7 days)
CREATE OR REPLACE VIEW trending_hashtags AS
SELECT
  tag,
  usage_count,
  last_used_at
FROM hashtags
WHERE last_used_at >= NOW() - INTERVAL '7 days'
ORDER BY usage_count DESC, last_used_at DESC
LIMIT 50;
