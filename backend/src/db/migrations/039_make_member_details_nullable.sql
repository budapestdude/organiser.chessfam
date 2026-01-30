-- Make migration 006 columns nullable since they're redundant with user_id
-- The code expects migration 005 schema and gets member details via user_id join

-- Remove NOT NULL constraints from migration 006 columns
ALTER TABLE club_memberships
  ALTER COLUMN member_name DROP NOT NULL,
  ALTER COLUMN member_email DROP NOT NULL,
  ALTER COLUMN membership_fee DROP NOT NULL;

-- These columns are kept for backward compatibility but are optional
-- Member details should be fetched via JOIN with users table using user_id

COMMENT ON COLUMN club_memberships.member_name IS 'Optional cached member name (use users.name via user_id instead)';
COMMENT ON COLUMN club_memberships.member_email IS 'Optional cached member email (use users.email via user_id instead)';
COMMENT ON COLUMN club_memberships.membership_fee IS 'Optional member-specific fee override (uses club.membership_fee if NULL)';
