-- Migration 027: Remove Placeholder/Sample Data
-- This migration removes sample data that was seeded for development

-- ============================================
-- 1. REMOVE SAMPLE COMMUNITIES
-- ============================================

-- Delete sample communities that were seeded in migration 021b
-- These are the hardcoded samples, not communities created from real venues/clubs/tournaments
DELETE FROM communities
WHERE slug IN (
  'marshall-chess-club',
  'washington-square-park',
  'chess-forum',
  'london-chess-centre',
  'barcelona-chess-club',
  'oslo-chess-house'
)
AND owner_id IS NULL;  -- Sample data has no owner

-- Also remove any community messages from deleted communities
DELETE FROM community_messages
WHERE community_id NOT IN (SELECT id FROM communities);

-- Remove any community members from deleted communities
DELETE FROM community_members
WHERE community_id NOT IN (SELECT id FROM communities);

-- Remove any user presence records for deleted communities
DELETE FROM user_presence
WHERE community_id IS NOT NULL
AND community_id NOT IN (SELECT id FROM communities);

-- ============================================
-- 2. CLEANUP ORPHANED DATA
-- ============================================

-- Remove any orphaned venue reviews
DELETE FROM venue_reviews
WHERE venue_id NOT IN (SELECT id FROM venues)
AND venue_id NOT IN (SELECT id FROM venue_submissions);

-- Remove any orphaned club reviews
DELETE FROM club_reviews
WHERE club_id NOT IN (SELECT id FROM clubs);

-- Remove any orphaned tournament reviews
DELETE FROM tournament_reviews
WHERE tournament_id NOT IN (SELECT id FROM tournaments);

-- ============================================
-- 3. LOG CLEANUP
-- ============================================

DO $$
DECLARE
  deleted_communities INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_communities = ROW_COUNT;
  RAISE NOTICE 'Migration 027: Removed placeholder data. Cleaned up orphaned records.';
END $$;
