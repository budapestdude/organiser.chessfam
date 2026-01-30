-- Fix club_memberships schema to match migration 005 expectations
-- Add missing role and joined_at columns that code depends on

-- Add role column (member, officer, admin, owner)
ALTER TABLE club_memberships
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'officer', 'admin', 'owner'));

-- Add joined_at column
ALTER TABLE club_memberships
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT NOW();

-- Update status check constraint to match migration 005
-- Drop old constraint if exists
ALTER TABLE club_memberships DROP CONSTRAINT IF EXISTS club_memberships_status_check;

-- Add new constraint matching migration 005
ALTER TABLE club_memberships
  ADD CONSTRAINT club_memberships_status_check
  CHECK (status IN ('active', 'inactive', 'banned', 'pending', 'cancelled', 'expired'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_club_memberships_role ON club_memberships(role);

-- Comments
COMMENT ON COLUMN club_memberships.role IS 'Member role: member, officer, admin, owner';
COMMENT ON COLUMN club_memberships.joined_at IS 'Date when user joined the club';
