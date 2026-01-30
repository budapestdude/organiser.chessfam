-- Add parent_bubble column to communities table
-- This tracks which main city bubble a community belongs to

ALTER TABLE communities ADD COLUMN IF NOT EXISTS parent_bubble VARCHAR(50);

-- Create index for efficient filtering by parent bubble
CREATE INDEX IF NOT EXISTS idx_communities_parent_bubble ON communities(parent_bubble) WHERE parent_bubble IS NOT NULL;

-- Update existing communities to set their parent_bubble based on city
UPDATE communities SET parent_bubble =
  CASE
    WHEN LOWER(city) LIKE '%new york%' OR LOWER(city) LIKE '%nyc%' OR LOWER(city) = 'ny' THEN 'new-york'
    WHEN LOWER(city) LIKE '%london%' THEN 'london'
    WHEN LOWER(city) LIKE '%barcelona%' THEN 'barcelona'
    WHEN LOWER(city) LIKE '%oslo%' THEN 'oslo'
    -- US cities go to New York
    WHEN LOWER(country) = 'us' OR LOWER(country) = 'usa' OR LOWER(country) = 'united states' THEN 'new-york'
    -- UK cities go to London
    WHEN LOWER(country) = 'gb' OR LOWER(country) = 'uk' OR LOWER(country) = 'united kingdom' THEN 'london'
    -- Spanish cities go to Barcelona
    WHEN LOWER(country) = 'es' OR LOWER(country) = 'spain' THEN 'barcelona'
    -- Scandinavian cities go to Oslo
    WHEN LOWER(country) IN ('no', 'norway', 'se', 'sweden', 'dk', 'denmark', 'fi', 'finland') THEN 'oslo'
    ELSE 'rest-of-world'
  END
WHERE parent_bubble IS NULL;
