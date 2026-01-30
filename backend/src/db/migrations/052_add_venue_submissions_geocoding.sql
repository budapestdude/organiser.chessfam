-- Migration 052: Add Geocoding to Venue Submissions
-- Add latitude and longitude fields to venue_submissions for map display

ALTER TABLE venue_submissions
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_venue_submissions_coordinates ON venue_submissions(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN venue_submissions.latitude IS 'Venue latitude for map display';
COMMENT ON COLUMN venue_submissions.longitude IS 'Venue longitude for map display';
