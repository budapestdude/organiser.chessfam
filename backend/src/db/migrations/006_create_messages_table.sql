-- Create Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  participant_1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id),
  CHECK (participant_1_id < participant_2_id) -- Ensure consistent ordering
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create message read status for each participant
CREATE TABLE IF NOT EXISTS conversation_read_status (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_conversation_read_status_conversation ON conversation_read_status(conversation_id);
CREATE INDEX idx_conversation_read_status_user ON conversation_read_status(user_id);

-- Comments
COMMENT ON TABLE conversations IS 'Direct message conversations between users';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE conversation_read_status IS 'Track read status per user per conversation';
