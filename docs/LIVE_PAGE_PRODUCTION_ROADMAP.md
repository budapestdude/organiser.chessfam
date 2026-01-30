# /live Page Production Roadmap

This document outlines the improvements needed to transform the /live page from a prototype into a production-grade product.

## Overview

The /live page is a real-time community hub for chess players, inspired by ro.am. It features:
- City "bubbles" showing active chess communities
- Real-time chat for each community
- Theater box for live streams/featured games
- "My Bubble" for personalized community collections
- Event tags highlighting current activities

---

## 1. Backend & API

### 1.1 WebSocket Server for Real-time Features
**Priority: High**

Create a WebSocket server to handle:
- Live chat messaging
- User presence (online/offline status)
- Check-in/check-out events
- Real-time tag updates

**Technical approach:**
- Use Socket.io or native WebSockets
- Implement rooms for each community
- Handle reconnection and message queuing
- Scale with Redis pub/sub for multiple server instances

### 1.2 REST API Endpoints
**Priority: High**

Required endpoints:

```
Communities:
GET    /api/communities              - List all communities
GET    /api/communities/:id          - Get community details
POST   /api/communities              - Create community (admin)
PUT    /api/communities/:id          - Update community
DELETE /api/communities/:id          - Delete community

GET    /api/communities/:id/members  - List members
POST   /api/communities/:id/join     - Join community
DELETE /api/communities/:id/leave    - Leave community

GET    /api/communities/:id/messages - Get chat history (paginated)
POST   /api/communities/:id/messages - Send message

Presence:
POST   /api/communities/:id/checkin  - Check in to community
DELETE /api/communities/:id/checkout - Check out

Users:
GET    /api/users/:id                - Get user profile
PUT    /api/users/:id                - Update profile
GET    /api/users/:id/communities    - User's communities

My Bubble:
GET    /api/me/bubble                - Get user's bubble
PUT    /api/me/bubble                - Update bubble (order, sizes)
POST   /api/me/bubble/rooms          - Add room to bubble
DELETE /api/me/bubble/rooms/:id      - Remove room from bubble

Tags:
GET    /api/tags                     - List available tags
PUT    /api/communities/:id/tags     - Update community tags (admin)
```

---

## 2. Database Schema

### 2.1 Core Tables
**Priority: High**

```sql
-- Communities (locations, clubs, tournaments can all be communities)
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'location', 'club', 'tournament'
  linked_entity_id UUID, -- FK to locations/clubs/tournaments
  city VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Community memberships
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'member', 'moderator', 'admin', 'owner'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Real-time presence/check-ins
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP DEFAULT NOW(),
  checked_out_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Event tags
CREATE TABLE community_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL, -- 'blitz', 'rapid', 'gm-present', etc.
  activated_by UUID REFERENCES users(id),
  activated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(community_id, tag)
);

-- User's My Bubble
CREATE TABLE user_bubble_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large'
  is_pinned BOOLEAN DEFAULT false,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- Theater content
CREATE TABLE theater_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'stream', 'game', 'event', 'announcement'
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  thumbnail_url TEXT,
  stream_url TEXT,
  white_player VARCHAR(255),
  black_player VARCHAR(255),
  white_rating INTEGER,
  black_rating INTEGER,
  is_live BOOLEAN DEFAULT false,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_community_created ON messages(community_id, created_at DESC);
CREATE INDEX idx_check_ins_community_active ON check_ins(community_id, is_active);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_communities_city ON communities(city);
CREATE INDEX idx_communities_location ON communities(latitude, longitude);
```

---

## 3. Authentication Integration

### 3.1 User Context in Communities
**Priority: High**

- Link existing auth system to community memberships
- Track user's joined communities
- Store user preferences (My Bubble, pinned chats)
- Handle guest vs authenticated user experiences

---

## 4. Real-time Features

### 4.1 Live User Presence
**Priority: High**

Track and display:
- Users currently online in each community
- Users checked-in at physical locations
- Last seen timestamps
- Typing indicators in chat

**Implementation:**
- WebSocket connection per user
- Heartbeat every 30 seconds
- Auto-checkout after 5 minutes of inactivity
- Presence data cached in Redis

### 4.2 Persistent Chat
**Priority: High**

Features:
- Message history with infinite scroll
- Unread message counts
- Message reactions (optional)
- @mentions with notifications
- Message edit/delete

---

## 5. Geolocation

### 5.1 User Location Detection
**Priority: Medium**

- Request browser geolocation permission
- Fall back to IP-based location
- Store user's home city preference
- Calculate distance to communities

### 5.2 Nearby Communities
**Priority: Medium**

- Query communities within radius (e.g., 50km)
- Sort by distance
- Auto-populate My Bubble with nearby communities
- Show distance on community cards

---

## 6. Media Handling

### 6.1 Image Uploads
**Priority: Medium**

- User avatar uploads
- Community cover images
- Chat image attachments
- Use cloud storage (S3, Cloudinary)
- Image optimization and resizing

### 6.2 Stream Embedding
**Priority: Medium**

Theater box integrations:
- YouTube live streams
- Twitch streams
- Lichess/Chess.com game embeds
- Custom video player for uploaded content

---

## 7. Admin & Moderation

### 7.1 Community Management Dashboard
**Priority: Medium**

For community owners/admins:
- Edit community details
- Manage members and roles
- View analytics
- Configure theater content
- Set active event tags

### 7.2 Moderation Tools
**Priority: Medium**

- Ban/mute users
- Delete messages
- Report system
- Audit log of mod actions
- Auto-moderation (spam filter)

---

## 8. Notifications

### 8.1 Push Notifications
**Priority: Low**

Notify users about:
- @mentions in chat
- New messages in pinned communities
- Events starting (tournaments, streams)
- Friend check-ins nearby

**Implementation:**
- Web Push API
- Service worker for background notifications
- User notification preferences

---

## 9. Mobile Experience

### 9.1 Responsive Design
**Priority: High**

- Mobile-first layout adjustments
- Touch-friendly interactions
- Swipe gestures for navigation
- Bottom navigation bar on mobile

### 9.2 PWA Support
**Priority: Medium**

- Service worker for offline support
- App manifest for installation
- Cache chat history offline
- Background sync for messages

---

## 10. Performance

### 10.1 Virtualized Lists
**Priority: Medium**

- Virtual scrolling for community lists
- Lazy load community cards
- Paginate chat messages
- Skeleton loading states

### 10.2 Caching
**Priority: Medium**

- Redis for session data
- Cache community metadata
- Cache user presence
- CDN for static assets

---

## 11. Search

### 11.1 Community & User Search
**Priority: Medium**

- Full-text search for communities
- Filter by city, type, tags
- Search users by name
- Search within chat history

---

## 12. Analytics

### 12.1 Usage Tracking
**Priority: Low**

Track:
- Active users per community
- Peak activity times
- Popular communities
- Chat engagement rates
- Feature usage (theater views, bubble customization)

---

## 13. Testing

### 13.1 Unit Tests
**Priority: Medium**

Test coverage for:
- React components
- State management
- API client functions
- Utility functions

### 13.2 E2E Tests
**Priority: Medium**

Test critical flows:
- Join/leave community
- Send/receive messages
- Check-in/check-out
- My Bubble customization
- Admin actions

---

## 14. Security

### 14.1 Input Validation
**Priority: High**

- Sanitize all user inputs
- Validate message content
- Prevent XSS attacks
- SQL injection protection (use parameterized queries)

---

## Implementation Order

**Phase 1 - Core Backend (Week 1-2)**
1. Database schema setup
2. REST API endpoints
3. WebSocket server basics
4. Auth integration

**Phase 2 - Real-time Features (Week 3-4)**
5. Live presence system
6. Persistent chat
7. Check-in functionality

**Phase 3 - User Experience (Week 5-6)**
8. Geolocation
9. Mobile responsive
10. Search

**Phase 4 - Content & Admin (Week 7-8)**
11. Image uploads
12. Stream embedding
13. Admin dashboard
14. Moderation tools

**Phase 5 - Polish (Week 9-10)**
15. Notifications
16. PWA support
17. Performance optimization
18. Analytics
19. Testing

---

## Tech Stack Recommendations

- **Backend:** Node.js with Express or Fastify
- **WebSockets:** Socket.io
- **Database:** PostgreSQL (Supabase for faster setup)
- **Cache:** Redis
- **File Storage:** Cloudinary or AWS S3
- **Search:** PostgreSQL full-text or Algolia
- **Hosting:** Vercel (frontend), Railway/Render (backend)
