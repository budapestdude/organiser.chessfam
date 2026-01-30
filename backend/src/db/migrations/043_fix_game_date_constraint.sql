-- ============================================
-- FIX GAME DATE CONSTRAINT
-- ============================================
-- The CHECK constraint on game_date prevents updating games with past dates.
-- This breaks game cancellation for past games.
-- Solution: Remove CHECK constraint and replace with INSERT-only trigger.

-- Drop the existing constraint
ALTER TABLE games
DROP CONSTRAINT IF EXISTS valid_game_date;

-- Create a trigger function to validate game_date only on INSERT
CREATE OR REPLACE FUNCTION validate_game_date_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate on INSERT, not UPDATE
  IF TG_OP = 'INSERT' THEN
    IF NEW.game_date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Game date cannot be in the past';
    END IF;

    IF NEW.game_date > CURRENT_DATE + INTERVAL '30 days' THEN
      RAISE EXCEPTION 'Game date cannot be more than 30 days in the future';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before INSERT
CREATE TRIGGER trigger_validate_game_date_on_insert
  BEFORE INSERT ON games
  FOR EACH ROW
  EXECUTE FUNCTION validate_game_date_on_insert();

COMMENT ON FUNCTION validate_game_date_on_insert()
  IS 'Validates game_date is within valid range (today to 30 days from now) only on INSERT';

COMMENT ON TRIGGER trigger_validate_game_date_on_insert ON games
  IS 'Validates game_date only when creating new games, not when updating existing games';
