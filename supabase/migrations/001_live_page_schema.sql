-- Migration: Live Page Production Schema
-- Description: Creates tables for communities, chat, presence, and user bubbles

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COMMUNITIES TABLE
-- ============================================
-- Represents chess communities (locations, clubs, tournaments)
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('location', 'club', 'tournament', 'online')),
  linked_entity_id UUID, -- FK to existing locations/clubs/tournaments tables

  -- Location data
  city VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Display
  image_url TEXT,
  cover_image_url TEXT,

  -- Settings
  is_visible BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- false = invite only

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMUNITY MEMBERS TABLE
-- ============================================
-- Tracks membership in communities
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role hierarchy: member < moderator < admin < owner
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),

  -- Status
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  banned_until TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(community_id, user_id)
);

-- ============================================
-- CHECK-INS TABLE
-- ============================================
-- Real-time presence tracking
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_out_at TIMESTAMP WITH TIME ZONE,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
-- Chat messages for communities
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Content
  content TEXT NOT NULL,

  -- Optional: reply to another message
  reply_to_id UUID REFERENCES community_messages(id) ON DELETE SET NULL,

  -- Status
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- COMMUNITY TAGS TABLE
-- ============================================
-- Event tags for communities (blitz, gm-present, etc.)
CREATE TABLE IF NOT EXISTS community_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

  -- Tag info
  tag VARCHAR(50) NOT NULL CHECK (tag IN (
    'blitz', 'rapid', 'classical',
    'gm-present', 'im-present',
    'tournament-live', 'lesson', 'simul', 'open-play'
  )),

  -- Who activated it
  activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = doesn't expire until manually removed

  UNIQUE(community_id, tag)
);

-- ============================================
-- USER BUBBLE ROOMS TABLE
-- ============================================
-- User's personalized "My Bubble" configuration
CREATE TABLE IF NOT EXISTS user_bubble_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

  -- Display settings
  position INTEGER NOT NULL DEFAULT 0,
  size VARCHAR(20) DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large')),
  is_pinned BOOLEAN DEFAULT false,

  -- Timestamps
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, community_id)
);

-- ============================================
-- PINNED CHATS TABLE
-- ============================================
-- User's pinned chat communities
CREATE TABLE IF NOT EXISTS user_pinned_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

  position INTEGER NOT NULL DEFAULT 0,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, community_id)
);

-- ============================================
-- THEATER CONTENT TABLE
-- ============================================
-- Featured content for theater box
CREATE TABLE IF NOT EXISTS theater_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  city VARCHAR(100), -- Can be city-wide theater, not tied to specific community

  -- Content type
  type VARCHAR(50) NOT NULL CHECK (type IN ('stream', 'game', 'event', 'announcement')),

  -- Content details
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  thumbnail_url TEXT,
  stream_url TEXT,

  -- For game type
  white_player VARCHAR(255),
  black_player VARCHAR(255),
  white_rating INTEGER,
  black_rating INTEGER,
  game_url TEXT,

  -- Status
  is_live BOOLEAN DEFAULT false,
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

-- ============================================
-- USER PROFILES EXTENSION
-- ============================================
-- Extend user data for live page
CREATE TABLE IF NOT EXISTS user_live_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Display info
  display_name VARCHAR(100),
  avatar_url TEXT,

  -- Chess info
  chess_rating INTEGER,
  chess_title VARCHAR(10), -- GM, IM, FM, etc.
  lichess_username VARCHAR(100),
  chesscom_username VARCHAR(100),

  -- Location
  home_city VARCHAR(100),
  home_country VARCHAR(100),

  -- Settings
  show_online_status BOOLEAN DEFAULT true,
  show_location BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Communities
CREATE INDEX IF NOT EXISTS idx_communities_city ON communities(city);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(type);
CREATE INDEX IF NOT EXISTS idx_communities_visible ON communities(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_communities_location ON communities(latitude, longitude) WHERE latitude IS NOT NULL;

-- Members
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(community_id, role);

-- Check-ins
CREATE INDEX IF NOT EXISTS idx_check_ins_community_active ON check_ins(community_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_check_ins_user_active ON check_ins(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_check_ins_heartbeat ON check_ins(last_heartbeat) WHERE is_active = true;

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_community_created ON community_messages(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON community_messages(user_id);

-- Tags
CREATE INDEX IF NOT EXISTS idx_community_tags_community ON community_tags(community_id);
CREATE INDEX IF NOT EXISTS idx_community_tags_expires ON community_tags(expires_at) WHERE expires_at IS NOT NULL;

-- Bubble
CREATE INDEX IF NOT EXISTS idx_bubble_rooms_user ON user_bubble_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_bubble_rooms_position ON user_bubble_rooms(user_id, position);

-- Theater
CREATE INDEX IF NOT EXISTS idx_theater_city ON theater_content(city) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_theater_community ON theater_content(community_id) WHERE is_live = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bubble_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pinned_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE theater_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_live_profiles ENABLE ROW LEVEL SECURITY;

-- Communities: Public read, admin write
CREATE POLICY "Communities are viewable by everyone" ON communities
  FOR SELECT USING (is_visible = true OR is_public = true);

CREATE POLICY "Community owners can update" ON communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = communities.id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Members: Users can see members of communities they're in
CREATE POLICY "Members viewable by community members" ON community_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_members.community_id
      AND c.is_public = true
    )
  );

CREATE POLICY "Users can join public communities" ON community_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id
      AND c.is_public = true
    )
  );

-- Check-ins: Visible to community members
CREATE POLICY "Check-ins visible to community members" ON check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = check_ins.community_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own check-ins" ON check_ins
  FOR ALL USING (user_id = auth.uid());

-- Messages: Visible to community members
CREATE POLICY "Messages visible to community members" ON community_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_messages.community_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages" ON community_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_messages.community_id
      AND cm.user_id = auth.uid()
      AND cm.is_banned = false
    )
  );

-- Tags: Viewable by all, editable by moderators+
CREATE POLICY "Tags are viewable by everyone" ON community_tags
  FOR SELECT USING (true);

CREATE POLICY "Moderators can manage tags" ON community_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_tags.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('moderator', 'admin', 'owner')
    )
  );

-- Bubble: Users can only access their own
CREATE POLICY "Users can manage own bubble" ON user_bubble_rooms
  FOR ALL USING (user_id = auth.uid());

-- Pinned chats: Users can only access their own
CREATE POLICY "Users can manage own pinned chats" ON user_pinned_chats
  FOR ALL USING (user_id = auth.uid());

-- Theater: Public read
CREATE POLICY "Theater content is public" ON theater_content
  FOR SELECT USING (true);

-- User profiles: Public read, own write
CREATE POLICY "Profiles are viewable by everyone" ON user_live_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_live_profiles
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_theater_updated_at
  BEFORE UPDATE ON theater_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profile_updated_at
  BEFORE UPDATE ON user_live_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to get community member count
CREATE OR REPLACE FUNCTION get_community_member_count(community_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM community_members
  WHERE community_id = community_uuid AND is_banned = false;
$$ LANGUAGE sql STABLE;

-- Function to get community online count
CREATE OR REPLACE FUNCTION get_community_online_count(community_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM check_ins
  WHERE community_id = community_uuid
  AND is_active = true
  AND last_heartbeat > NOW() - INTERVAL '5 minutes';
$$ LANGUAGE sql STABLE;

-- Function to clean up stale check-ins
CREATE OR REPLACE FUNCTION cleanup_stale_checkins()
RETURNS void AS $$
BEGIN
  UPDATE check_ins
  SET is_active = false, checked_out_at = NOW()
  WHERE is_active = true
  AND last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tags
CREATE OR REPLACE FUNCTION cleanup_expired_tags()
RETURNS void AS $$
BEGIN
  DELETE FROM community_tags
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
