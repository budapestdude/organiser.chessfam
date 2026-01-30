-- Create club messaging system tables

-- Club messages table
CREATE TABLE IF NOT EXISTS club_messages (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type VARCHAR(50) DEFAULT 'general' CHECK (message_type IN ('general', 'announcement', 'event')),
  message_text TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Club message reads table (track who has read which messages)
CREATE TABLE IF NOT EXISTS club_message_reads (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES club_messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_messages_club ON club_messages(club_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_sender ON club_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_created ON club_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_message_reads_user ON club_message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_club_message_reads_message ON club_message_reads(message_id);

-- Comments
COMMENT ON TABLE club_messages IS 'Messages posted in club discussions';
COMMENT ON TABLE club_message_reads IS 'Tracks which users have read which messages';
COMMENT ON COLUMN club_messages.message_type IS 'Type of message: general, announcement, or event';
COMMENT ON COLUMN club_messages.is_pinned IS 'Pinned messages appear at top of discussion';
