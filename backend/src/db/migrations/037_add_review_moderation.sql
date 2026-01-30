-- Add review moderation fields to club_reviews table

ALTER TABLE club_reviews
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
  ADD COLUMN IF NOT EXISTS flagged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP;

-- Add index for moderation queries
CREATE INDEX IF NOT EXISTS idx_club_reviews_flagged ON club_reviews(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_club_reviews_hidden ON club_reviews(is_hidden);

-- Comments
COMMENT ON COLUMN club_reviews.is_flagged IS 'Whether review has been flagged for moderation';
COMMENT ON COLUMN club_reviews.flagged_reason IS 'Reason provided when flagging review';
COMMENT ON COLUMN club_reviews.is_hidden IS 'Whether review is hidden by club owner/admin';
COMMENT ON COLUMN club_reviews.hidden_by IS 'User ID of moderator who hid the review';
