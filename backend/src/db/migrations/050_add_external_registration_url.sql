-- Migration 050: Add External Registration URL
-- Allow tournaments to use external registration systems instead of internal flow

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS external_registration_url TEXT;

COMMENT ON COLUMN tournaments.external_registration_url IS 'External URL for tournament registration (overrides internal registration flow)';

-- Create index for tournaments with external registration
CREATE INDEX IF NOT EXISTS idx_tournaments_external_registration ON tournaments(external_registration_url) WHERE external_registration_url IS NOT NULL;
