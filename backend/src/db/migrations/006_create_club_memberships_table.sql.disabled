CREATE TABLE IF NOT EXISTS club_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL,

  -- Member details
  member_name VARCHAR(255) NOT NULL,
  member_rating INTEGER,
  member_email VARCHAR(255) NOT NULL,
  member_phone VARCHAR(50),

  -- Membership details
  membership_fee DECIMAL(10, 2) NOT NULL,
  membership_type VARCHAR(50) DEFAULT 'monthly' NOT NULL CHECK (membership_type IN (
    'monthly', 'yearly', 'lifetime'
  )),
  status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN (
    'pending', 'active', 'cancelled', 'expired'
  )),

  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_status ON club_memberships(status);
