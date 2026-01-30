-- Migration 051: Add Organizer Name Override
-- Allow tournaments to display a custom organizer name instead of the user's name

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS organizer_name_override TEXT;

COMMENT ON COLUMN tournaments.organizer_name_override IS 'Custom organizer name (overrides users.name when set). Useful for famous tournaments or organizations.';

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer_override ON tournaments(organizer_name_override) WHERE organizer_name_override IS NOT NULL;
