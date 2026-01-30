-- Migration 026: Schema Consolidation and Documentation
-- This migration documents the schema state and ensures consistency
-- across tables that had multiple definitions in earlier migrations.

-- ============================================
-- DOCUMENTATION: DUPLICATE SCHEMA HISTORY
-- ============================================

/*
SCHEMA AUDIT FINDINGS:
Several tables were defined in multiple migrations with CREATE TABLE IF NOT EXISTS.
The first migration to run wins, so later definitions were ignored.
This documents the intended final state.

1. player_reviews:
   - Migration 007: sportsmanship, skill_level, communication columns
   - Migration 009 (WINNER): badges TEXT[] column
   Current schema uses migration 009 structure.

2. achievements:
   - Migration 007: requirement JSONB, 8 achievements
   - Migration 012 (WINNER): achievement_key, tier, requirement_value, 18+ achievements
   Current schema uses migration 012 structure.

3. tournament_registrations:
   - Migration 005a: player_name, player_rating, entry_fee columns
   - Migration 005b: similar but in different file
   Whichever ran first is in use. Schema is consistent.

4. club_memberships:
   - Migration 005: role, joined_at, status columns (for community features)
   - Migration 006 (WINNER): member_name, member_email, membership_fee, membership_type
   Current schema uses migration 006 structure.

5. venue_reviews:
   - Migration 004: references venues(id), has helpful_count
   - Migration 010: references venue_submissions(id), different structure
   Migration 004 ran first, so venue_reviews references venues table.
   Migration 025 fixes any incorrect FKs.

RECOMMENDATION: Future migrations should check IF EXISTS before modifying
and use ALTER TABLE instead of CREATE TABLE IF NOT EXISTS for additions.
*/

-- ============================================
-- ENSURE CONSISTENT COLUMN TYPES
-- ============================================

-- Ensure player_reviews has the badges column (from migration 009)
ALTER TABLE player_reviews ADD COLUMN IF NOT EXISTS badges TEXT[];

-- Ensure achievements has all required columns (from migration 012)
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS achievement_key VARCHAR(100);
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'bronze';
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS requirement_value INTEGER DEFAULT 1;

-- Create unique index on achievement_key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'achievements_achievement_key_key'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_key ON achievements(achievement_key);
  END IF;
END $$;

-- ============================================
-- ADD MISSING COLUMNS TO ENSURE COMPATIBILITY
-- ============================================

-- Ensure tournament_registrations has payment columns (from migration 019)
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS payment_id INTEGER;

-- Ensure bookings has payment columns (from migration 019)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id INTEGER;

-- ============================================
-- ADD VENUE REFERENCE CONSISTENCY
-- ============================================

-- The system has two venue tables:
-- 1. venues (migration 004) - the main venues table for approved venues
-- 2. venue_submissions (migration 007) - user-submitted venues awaiting approval

-- Venues table is the source of truth for public listings
-- venue_submissions is for the submission/approval workflow

-- Add is_from_submission column to track venues that came from submissions
ALTER TABLE venues ADD COLUMN IF NOT EXISTS source_submission_id INTEGER;

-- Document the relationship
COMMENT ON COLUMN venues.source_submission_id IS 'ID from venue_submissions if this venue was created from an approved submission';

-- ============================================
-- CLEANUP UNUSED/DUPLICATE STRUCTURES
-- ============================================

-- The old 'checkins' table from migration 004 is superseded by 'venue_checkins' from migration 011
-- Keep both for backwards compatibility but document venue_checkins as preferred
COMMENT ON TABLE venue_checkins IS 'User check-ins at venues (preferred table over legacy checkins)';

-- Document the checkins table as legacy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkins') THEN
    COMMENT ON TABLE checkins IS 'LEGACY: Use venue_checkins table instead. Kept for backwards compatibility.';
  END IF;
END $$;

-- ============================================
-- ENSURE ALL REVIEWS TABLES HAVE CONSISTENT STRUCTURE
-- ============================================

-- All review tables should have: id, reviewer_id, [entity]_id, rating, review_text, created_at, updated_at
-- Ensure venue_reviews has review_text column (it might be named 'content' or 'title'/'content')
ALTER TABLE venue_reviews ADD COLUMN IF NOT EXISTS review_text TEXT;

-- Migrate data if content column exists but review_text doesn't have data
UPDATE venue_reviews SET review_text = content WHERE review_text IS NULL AND content IS NOT NULL;

-- ============================================
-- ADD SCHEMA VERSION TRACKING
-- ============================================

-- Create schema_info table if not exists to track schema version
CREATE TABLE IF NOT EXISTS schema_info (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Record current schema version
INSERT INTO schema_info (key, value, updated_at)
VALUES ('schema_version', '026', NOW())
ON CONFLICT (key) DO UPDATE SET value = '026', updated_at = NOW();

INSERT INTO schema_info (key, value, updated_at)
VALUES ('last_consolidation', '2024-12-27', NOW())
ON CONFLICT (key) DO UPDATE SET value = '2024-12-27', updated_at = NOW();

-- ============================================
-- SUMMARY
-- ============================================

/*
This migration:
1. Documents the history of duplicate table definitions
2. Adds missing columns to ensure all expected fields exist
3. Creates schema_info table for version tracking
4. Adds comments to clarify legacy vs current tables
5. Ensures consistency across review tables

After this migration, the schema should be consistent with:
- player_reviews: has badges TEXT[]
- achievements: has achievement_key, tier, requirement_value
- tournament_registrations: has payment_status, payment_id
- bookings: has payment_status, payment_id
- venue_checkins: is the preferred check-in table
- venues: has source_submission_id for tracking approved submissions
*/

DO $$
BEGIN
  RAISE NOTICE 'Migration 026 completed: Schema consolidated and documented';
END $$;
