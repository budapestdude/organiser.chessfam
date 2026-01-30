-- Allow open challenges by making challenged_id nullable
-- This enables challenges without a specific opponent

-- Drop the old constraint that requires different users
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS different_users;

-- Make challenged_id nullable to support open challenges
ALTER TABLE challenges ALTER COLUMN challenged_id DROP NOT NULL;

-- Add new constraint that only checks when challenged_id is not null
ALTER TABLE challenges ADD CONSTRAINT different_users
  CHECK (challenged_id IS NULL OR challenger_id != challenged_id);

-- Update foreign key to allow NULL (it already has ON DELETE CASCADE)
-- The foreign key constraint will only apply when challenged_id is not NULL
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_challenged_id_fkey;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenged_id_fkey
  FOREIGN KEY (challenged_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add index for open challenges
CREATE INDEX IF NOT EXISTS idx_challenges_open ON challenges(status, expires_at)
  WHERE challenged_id IS NULL AND status = 'pending';
