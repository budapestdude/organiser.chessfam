-- Migration 069: Automatically set is_master=true when chess title is verified

-- Create trigger function to automatically grant master status when chess title is verified
CREATE OR REPLACE FUNCTION auto_grant_master_on_title_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- If chess title verification status changed to true, automatically grant master status
  IF NEW.chess_title_verified = TRUE AND (OLD.chess_title_verified IS NULL OR OLD.chess_title_verified = FALSE) THEN
    NEW.is_master = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_auto_master_on_title_verification ON users;
CREATE TRIGGER trigger_auto_master_on_title_verification
BEFORE UPDATE OF chess_title_verified ON users
FOR EACH ROW
EXECUTE FUNCTION auto_grant_master_on_title_verification();

-- Update existing users with verified titles to be masters
UPDATE users
SET is_master = TRUE
WHERE chess_title_verified = TRUE AND is_master = FALSE;
