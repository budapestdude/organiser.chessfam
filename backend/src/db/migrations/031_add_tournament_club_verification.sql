-- Add verification/approval workflow to tournaments and clubs
-- Similar to venue_submissions table structure

-- Add verification columns to tournaments table (separate statements for IF NOT EXISTS)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add verification columns to clubs table (separate statements for IF NOT EXISTS)
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create indexes for filtering by approval_status
CREATE INDEX IF NOT EXISTS idx_tournaments_approval_status ON tournaments(approval_status);
CREATE INDEX IF NOT EXISTS idx_clubs_approval_status ON clubs(approval_status);

-- Update existing tournaments and clubs to 'approved' approval_status
-- (so they remain visible after migration)
UPDATE tournaments SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = 'pending';
UPDATE clubs SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = 'pending';

-- Add check constraints
ALTER TABLE tournaments ADD CONSTRAINT tournaments_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE clubs ADD CONSTRAINT clubs_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));
