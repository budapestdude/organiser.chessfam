-- Migration 070: Add titled player discount options to tournaments
-- Allows organizers to set discounts for titled players (GM/WGM, IM/WIM, FM/WFM)

-- Add titled player discount columns to tournaments table
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS gm_wgm_discount DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS im_wim_discount DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fm_wfm_discount DECIMAL(5, 2) DEFAULT 0;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_tournaments_gm_wgm_discount ON tournaments(gm_wgm_discount) WHERE gm_wgm_discount > 0;
CREATE INDEX IF NOT EXISTS idx_tournaments_im_wim_discount ON tournaments(im_wim_discount) WHERE im_wim_discount > 0;
CREATE INDEX IF NOT EXISTS idx_tournaments_fm_wfm_discount ON tournaments(fm_wfm_discount) WHERE fm_wfm_discount > 0;

-- Comments
COMMENT ON COLUMN tournaments.gm_wgm_discount IS
  'Percentage discount for GM/WGM players (e.g., 30.00 for 30% off). Default 0 means no discount.';
COMMENT ON COLUMN tournaments.im_wim_discount IS
  'Percentage discount for IM/WIM players (e.g., 25.00 for 25% off). Default 0 means no discount.';
COMMENT ON COLUMN tournaments.fm_wfm_discount IS
  'Percentage discount for FM/WFM players (e.g., 20.00 for 20% off). Default 0 means no discount.';

-- Example usage:
-- gm_wgm_discount = 30.00 means 30% off for GMs and WGMs
-- im_wim_discount = 25.00 means 25% off for IMs and WIMs
-- fm_wfm_discount = 20.00 means 20% off for FMs and WFMs
-- All discounts are percentage-based and apply to verified titled players only
