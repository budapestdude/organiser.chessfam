-- Migration 076: Add author approval system
-- Users must submit their first blog for manual approval before posting freely

-- Add author approval tracking to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_approved_author BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS author_approved_at TIMESTAMP;

-- Add 'pending' to blog status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'blogs_status_check'
  ) THEN
    ALTER TABLE blogs
      ADD CONSTRAINT blogs_status_check
      CHECK (status IN ('draft', 'published', 'archived', 'pending'));
  ELSE
    -- Drop and recreate constraint with 'pending' added
    ALTER TABLE blogs DROP CONSTRAINT IF EXISTS blogs_status_check;
    ALTER TABLE blogs
      ADD CONSTRAINT blogs_status_check
      CHECK (status IN ('draft', 'published', 'archived', 'pending'));
  END IF;
END $$;

-- Update existing blogs to ensure all published blogs' authors are approved
UPDATE users
SET is_approved_author = TRUE,
    author_approved_at = NOW()
WHERE id IN (
  SELECT DISTINCT author_id
  FROM blogs
  WHERE status = 'published'
);

-- Add index for querying pending blogs
CREATE INDEX IF NOT EXISTS idx_blogs_status_pending ON blogs(status) WHERE status = 'pending';

-- Add index for querying approved authors
CREATE INDEX IF NOT EXISTS idx_users_is_approved_author ON users(is_approved_author) WHERE is_approved_author = TRUE;
