-- Add images array column to posts table to support multiple images per post
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[];

-- Create index for images array queries
CREATE INDEX IF NOT EXISTS idx_posts_images ON posts USING GIN(images);

COMMENT ON COLUMN posts.images IS 'Array of image URLs for posts with multiple images (up to 4)';
