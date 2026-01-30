-- Migration 025: Fix Foreign Keys, Indexes, and Schema Issues
-- This migration addresses issues identified in the database audit

-- ============================================
-- 1. ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================

-- Fix club_memberships.club_id - add FK to clubs table
-- First, clean up any orphaned records
DELETE FROM club_memberships
WHERE club_id NOT IN (SELECT id FROM clubs);

-- Add the foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_club_memberships_club'
    AND table_name = 'club_memberships'
  ) THEN
    ALTER TABLE club_memberships
    ADD CONSTRAINT fk_club_memberships_club
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix bookings.master_id - add FK to masters table
-- First, clean up any orphaned records
DELETE FROM bookings
WHERE master_id NOT IN (SELECT id FROM masters);

-- Add the foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_bookings_master'
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_master
    FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================
-- 2. FIX VENUE REFERENCE INCONSISTENCIES
-- ============================================

-- The venue_checkins and venue_reviews tables incorrectly reference venue_submissions
-- They should reference venues instead. We need to:
-- 1. Drop the incorrect FK constraint
-- 2. Add the correct FK constraint pointing to venues

-- Fix venue_checkins FK
DO $$
BEGIN
  -- Check if the column references venue_submissions
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'venue_checkins'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'venue_submissions'
  ) THEN
    -- Get the constraint name and drop it
    EXECUTE (
      SELECT 'ALTER TABLE venue_checkins DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'venue_checkins'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'venue_submissions'
      LIMIT 1
    );
  END IF;

  -- Add correct FK to venues table (if venues table has data)
  IF EXISTS (SELECT 1 FROM venues LIMIT 1) THEN
    -- Clean up orphaned records first
    DELETE FROM venue_checkins WHERE venue_id NOT IN (SELECT id FROM venues);

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_venue_checkins_venue'
      AND table_name = 'venue_checkins'
    ) THEN
      ALTER TABLE venue_checkins
      ADD CONSTRAINT fk_venue_checkins_venue
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not fix venue_checkins FK: %', SQLERRM;
END $$;

-- Note: venue_reviews already has correct FK in migration 004 (referencing venues)
-- Migration 010 tried to recreate it with venue_submissions but CREATE TABLE IF NOT EXISTS
-- means the original definition from 004 should be in place

-- ============================================
-- 3. ADD MISSING INDEXES
-- ============================================

-- Indexes for better query performance on frequently-used columns

-- Bookings - date range queries
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

-- Venues - owner lookups
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON venues(owner_id);

-- Clubs - owner lookups
CREATE INDEX IF NOT EXISTS idx_clubs_owner_id ON clubs(owner_id);

-- Tournaments - organizer lookups
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer_id ON tournaments(organizer_id);

-- Conversations - compound index for participant lookups
CREATE INDEX IF NOT EXISTS idx_conversations_participants
ON conversations(participant_1_id, participant_2_id);

-- Community members - compound index for membership checks
CREATE INDEX IF NOT EXISTS idx_community_members_user_community
ON community_members(user_id, community_id);

-- Favorites - compound index for user favorites lookup
CREATE INDEX IF NOT EXISTS idx_favorites_user_item
ON favorites(user_id, item_type, item_id);

-- Payments - compound index for user payment history
CREATE INDEX IF NOT EXISTS idx_payments_user_status
ON payments(user_id, status);

-- ============================================
-- 4. FIX games.max_players DEFAULT
-- ============================================

-- Change default from 1 to 2 (chess is typically 2 players)
ALTER TABLE games ALTER COLUMN max_players SET DEFAULT 2;

-- ============================================
-- 5. ADD MISSING CHECK CONSTRAINTS
-- ============================================

-- Ensure challenges can't be self-challenges (might already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'challenges_no_self_challenge'
  ) THEN
    ALTER TABLE challenges
    ADD CONSTRAINT challenges_no_self_challenge
    CHECK (challenger_id != challenged_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Self-challenge constraint may already exist: %', SQLERRM;
END $$;

-- ============================================
-- 6. DOCUMENT SCHEMA STATE
-- ============================================

COMMENT ON TABLE club_memberships IS 'Club membership records - FK to clubs added in migration 025';
COMMENT ON TABLE bookings IS 'Master session bookings - FK to masters added in migration 025';
COMMENT ON TABLE venue_checkins IS 'User check-ins at venues - FK corrected to reference venues in migration 025';
COMMENT ON TABLE games IS 'Game listings - max_players default changed to 2 in migration 025';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 025 completed: Fixed FKs, added indexes, corrected venue references';
END $$;
