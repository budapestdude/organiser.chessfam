-- Ownership Transfer System
-- Allows entities to be created without owners and transferred later

-- Create ownership_transfers table to track transfer history
CREATE TABLE IF NOT EXISTS ownership_transfers (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'venue', 'club', 'tournament', 'community'
  entity_id INTEGER NOT NULL,
  from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL if originally unclaimed
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transfer_type VARCHAR(50) NOT NULL DEFAULT 'transfer', -- 'transfer', 'claim', 'admin_assign'
  reason TEXT,
  transferred_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- admin who performed transfer, or owner
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create ownership_claims table for pending claim requests
CREATE TABLE IF NOT EXISTS ownership_claims (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  claimer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  claim_reason TEXT,
  verification_info JSONB, -- proof of ownership (business docs, etc.)
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, claimer_id, status) -- prevent duplicate pending claims
);

-- Add claim_code to entities for easy claiming
-- This is a unique code that can be shared to allow someone to claim ownership

-- Add to venue_submissions (venues)
ALTER TABLE venue_submissions
  ADD COLUMN IF NOT EXISTS claim_code VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_claimable BOOLEAN DEFAULT true;

-- Add to clubs
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS claim_code VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_claimable BOOLEAN DEFAULT true;

-- Add to tournaments
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS claim_code VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_claimable BOOLEAN DEFAULT true;

-- Add to communities
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS claim_code VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_claimable BOOLEAN DEFAULT true;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_entity ON ownership_transfers(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_to_user ON ownership_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_ownership_claims_entity ON ownership_claims(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ownership_claims_claimer ON ownership_claims(claimer_id);
CREATE INDEX IF NOT EXISTS idx_ownership_claims_status ON ownership_claims(status);

-- Comments
COMMENT ON TABLE ownership_transfers IS 'Audit log of all ownership transfers';
COMMENT ON TABLE ownership_claims IS 'Pending requests to claim ownership of unclaimed entities';
COMMENT ON COLUMN ownership_transfers.transfer_type IS 'Type: transfer (owner to owner), claim (unclaimed to owner), admin_assign (admin action)';
COMMENT ON COLUMN ownership_claims.verification_info IS 'JSON with proof documents, business registration, etc.';
