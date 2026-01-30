-- Communities Migration
-- Run this SQL in your Railway PostgreSQL database

-- Communities table (for rooms/bubbles on the Live page)
CREATE TABLE IF NOT EXISTS communities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'venue', -- venue, club, tournament, online
    city VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    image VARCHAR(500),
    banner_image VARCHAR(500),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    member_count INTEGER DEFAULT 0,
    max_members INTEGER,
    tags TEXT[], -- Array of tags like 'blitz', 'rapid', 'gm-present'
    metadata JSONB DEFAULT '{}', -- Flexible metadata storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community members table
CREATE TABLE IF NOT EXISTS community_members (
    id SERIAL PRIMARY KEY,
    community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, moderator, member
    status VARCHAR(50) DEFAULT 'active', -- active, banned, muted, pending
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(community_id, user_id)
);

-- Community messages table (for chat)
CREATE TABLE IF NOT EXISTS community_messages (
    id SERIAL PRIMARY KEY,
    community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, system
    reply_to_id INTEGER REFERENCES community_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User presence table (for tracking who's online/checked-in)
CREATE TABLE IF NOT EXISTS user_presence (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'online', -- online, away, busy, offline
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_in_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}', -- Can store device info, etc.
    UNIQUE(user_id, community_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_communities_city ON communities(city);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(type);
CREATE INDEX IF NOT EXISTS idx_communities_is_active ON communities(is_active);
CREATE INDEX IF NOT EXISTS idx_communities_tags ON communities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_community ON community_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_user ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_community ON user_presence(community_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON communities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_messages_updated_at ON community_messages;
CREATE TRIGGER update_community_messages_updated_at
    BEFORE UPDATE ON community_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample communities for testing
INSERT INTO communities (name, slug, description, type, city, country, latitude, longitude, tags, is_active)
VALUES
    ('Marshall Chess Club', 'marshall-chess-club', 'Historic chess club in Greenwich Village', 'club', 'New York', 'US', 40.7336, -74.0027, ARRAY['classical', 'tournament-live', 'gm-present'], true),
    ('Washington Square Park', 'washington-square-park', 'Famous outdoor chess spot', 'venue', 'New York', 'US', 40.7308, -73.9973, ARRAY['blitz', 'rapid', 'open-play'], true),
    ('Chess Forum', 'chess-forum', 'Iconic chess shop with playing area', 'venue', 'New York', 'US', 40.7324, -73.9985, ARRAY['rapid', 'lesson'], true),
    ('London Chess Centre', 'london-chess-centre', 'Premier chess venue in London', 'venue', 'London', 'GB', 51.5155, -0.1411, ARRAY['classical', 'tournament-live'], true),
    ('Barcelona Chess Club', 'barcelona-chess-club', 'Historic club in Barcelona', 'club', 'Barcelona', 'ES', 41.3851, 2.1734, ARRAY['rapid', 'blitz', 'gm-present'], true),
    ('Oslo Chess House', 'oslo-chess-house', 'Home of Magnus Carlsen''s club', 'club', 'Oslo', 'NO', 59.9139, 10.7522, ARRAY['classical', 'gm-present', 'im-present'], true)
ON CONFLICT (slug) DO NOTHING;
