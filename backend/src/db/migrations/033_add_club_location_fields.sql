-- Add missing location fields to clubs table
-- This allows storing complete address information and geocoordinates

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_clubs_state ON clubs(state);
CREATE INDEX IF NOT EXISTS idx_clubs_coordinates ON clubs(latitude, longitude);

-- Add comment
COMMENT ON COLUMN clubs.address IS 'Street address of the club';
COMMENT ON COLUMN clubs.state IS 'State or province';
COMMENT ON COLUMN clubs.latitude IS 'Latitude coordinate for map display';
COMMENT ON COLUMN clubs.longitude IS 'Longitude coordinate for map display';
