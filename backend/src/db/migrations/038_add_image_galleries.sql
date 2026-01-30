-- Migration 038: Add Image Galleries
-- Add images JSONB column to tournaments, venues, and clubs for multiple image support
-- The existing 'image' column will be the primary/cover image
-- The 'images' column will store an array of additional gallery images

-- Add images column to tournaments
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN tournaments.images IS 'Array of image URLs for tournament gallery';

-- Add images column to venues
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN venues.images IS 'Array of image URLs for venue gallery';

-- Add images column to clubs
ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN clubs.images IS 'Array of image URLs for club gallery';

-- Create indexes for JSONB queries (optional but helpful for performance)
CREATE INDEX IF NOT EXISTS idx_tournaments_images_gin ON tournaments USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_venues_images_gin ON venues USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_clubs_images_gin ON clubs USING GIN (images);
