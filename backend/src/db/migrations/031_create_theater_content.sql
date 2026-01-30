-- Theater Content Migration
-- Adds theater content table for displaying streams/games in community bubbles

-- Theater content table
CREATE TABLE IF NOT EXISTS theater_content (
    id SERIAL PRIMARY KEY,
    community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
    city VARCHAR(100), -- Can be city-wide theater, not tied to specific community

    -- Content type
    type VARCHAR(50) NOT NULL CHECK (type IN ('stream', 'game', 'event', 'announcement')),

    -- Content details
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    thumbnail_url TEXT,
    stream_url TEXT, -- YouTube, Twitch, etc.

    -- For game type
    white_player VARCHAR(255),
    black_player VARCHAR(255),
    white_rating INTEGER,
    black_rating INTEGER,
    game_url TEXT,

    -- Status
    is_live BOOLEAN DEFAULT FALSE,
    viewer_count INTEGER DEFAULT 0,

    -- Scheduling
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,

    -- Priority (higher = shown first)
    priority INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_theater_content_community ON theater_content(community_id) WHERE is_live = TRUE;
CREATE INDEX IF NOT EXISTS idx_theater_content_city ON theater_content(city) WHERE is_live = TRUE;
CREATE INDEX IF NOT EXISTS idx_theater_content_priority ON theater_content(priority DESC, created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_theater_content_updated_at ON theater_content;
CREATE TRIGGER update_theater_content_updated_at
    BEFORE UPDATE ON theater_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample theater content for testing
INSERT INTO theater_content (community_id, type, title, subtitle, stream_url, is_live, priority)
SELECT
    c.id,
    'stream',
    'Live Chess on ' || c.name,
    'Watch live games and commentary',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', -- Sample URL
    false,
    0
FROM communities c
WHERE c.slug IN ('marshall-chess-club', 'london-chess-centre')
ON CONFLICT DO NOTHING;
