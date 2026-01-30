// Types for the /live page production features

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type CommunityType = 'location' | 'club' | 'tournament' | 'online' | 'city';

export type MemberRole = 'member' | 'moderator' | 'admin' | 'owner';

export type EventTag =
  | 'blitz'
  | 'rapid'
  | 'classical'
  | 'gm-present'
  | 'im-present'
  | 'tournament-live'
  | 'lesson'
  | 'simul'
  | 'open-play';

export type RoomSize = 'small' | 'medium' | 'large';

export type TheaterType = 'stream' | 'game' | 'event' | 'announcement';

export const EVENT_TAG_LABELS: Record<EventTag, string> = {
  'blitz': 'Blitz',
  'rapid': 'Rapid',
  'classical': 'Classical',
  'gm-present': 'GM Here',
  'im-present': 'IM Here',
  'tournament-live': 'Live Tournament',
  'lesson': 'Lesson',
  'simul': 'Simul',
  'open-play': 'Open Play',
};

export const EVENT_TAG_COLORS: Record<EventTag, string> = {
  'blitz': 'bg-yellow-500',
  'rapid': 'bg-orange-500',
  'classical': 'bg-blue-500',
  'gm-present': 'bg-purple-500',
  'im-present': 'bg-indigo-500',
  'tournament-live': 'bg-red-500',
  'lesson': 'bg-green-500',
  'simul': 'bg-pink-500',
  'open-play': 'bg-cyan-500',
};

// ============================================
// COMMUNITY
// ============================================

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: CommunityType;
  linkedEntityId?: string;

  // Location
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;

  // Display
  imageUrl?: string;
  coverImageUrl?: string;

  // Settings
  isVisible: boolean;
  isPublic: boolean;

  // Computed (from API)
  memberCount?: number;
  onlineCount?: number;
  activeTags?: EventTag[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CommunityWithDetails extends Community {
  members?: CommunityMember[];
  recentMessages?: Message[];
  theater?: TheaterContent;
}

// ============================================
// MEMBERSHIP
// ============================================

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: MemberRole;
  isBanned: boolean;
  banReason?: string;
  bannedUntil?: string;
  joinedAt: string;

  // Joined user data
  user?: UserProfile;
}

// ============================================
// CHECK-INS / PRESENCE
// ============================================

export interface CheckIn {
  id: string;
  communityId: string;
  userId: string;
  isActive: boolean;
  checkedInAt: string;
  checkedOutAt?: string;
  lastHeartbeat: string;

  // Joined user data
  user?: UserProfile;
}

// ============================================
// MESSAGES
// ============================================

export interface Message {
  id: string;
  communityId: string;
  userId?: string;
  content: string;
  replyToId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;

  // Joined user data
  user?: UserProfile;

  // Joined reply data
  replyTo?: Message;
}

export interface SendMessagePayload {
  communityId: string;
  content: string;
  replyToId?: string;
}

// ============================================
// TAGS
// ============================================

export interface CommunityTag {
  id: string;
  communityId: string;
  tag: EventTag;
  activatedBy?: string;
  activatedAt: string;
  expiresAt?: string;
}

// ============================================
// USER BUBBLE
// ============================================

export interface BubbleRoom {
  id: string;
  userId: string;
  communityId: string;
  position: number;
  size: RoomSize;
  isPinned: boolean;
  addedAt: string;

  // Joined community data
  community?: Community;
}

export interface UpdateBubblePayload {
  rooms: {
    communityId: string;
    position: number;
    size: RoomSize;
    isPinned: boolean;
  }[];
}

// ============================================
// PINNED CHATS
// ============================================

export interface PinnedChat {
  id: string;
  userId: string;
  communityId: string;
  position: number;
  pinnedAt: string;

  // Joined community data
  community?: Community;
}

// ============================================
// THEATER
// ============================================

export interface TheaterContent {
  id: string;
  communityId?: string;
  city?: string;
  type: TheaterType;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  streamUrl?: string;

  // Game type
  whitePlayer?: string;
  blackPlayer?: string;
  whiteRating?: number;
  blackRating?: number;
  gameUrl?: string;

  // Status
  isLive: boolean;
  viewerCount: number;

  // Scheduling
  startsAt?: string;
  endsAt?: string;

  priority: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// USER PROFILE
// ============================================

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;

  // Chess info
  chessRating?: number;
  chessTitle?: string;
  chessTitleVerified?: boolean;
  lichessUsername?: string;
  chesscomUsername?: string;

  // Location
  homeCity?: string;
  homeCountry?: string;

  // Settings
  showOnlineStatus: boolean;
  showLocation: boolean;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// WEBSOCKET EVENTS
// ============================================

export type WebSocketEvent =
  | { type: 'message:new'; payload: Message }
  | { type: 'message:edit'; payload: Message }
  | { type: 'message:delete'; payload: { messageId: string; communityId: string } }
  | { type: 'presence:join'; payload: CheckIn }
  | { type: 'presence:leave'; payload: { userId: string; communityId: string } }
  | { type: 'presence:update'; payload: { communityId: string; onlineCount: number } }
  | { type: 'tag:add'; payload: CommunityTag }
  | { type: 'tag:remove'; payload: { tagId: string; communityId: string } }
  | { type: 'theater:update'; payload: TheaterContent }
  | { type: 'community:update'; payload: Community };

// ============================================
// CITY DATA
// ============================================

export interface CityData {
  id: string;
  name: string;
  country: string;
  flag: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const SUPPORTED_CITIES: CityData[] = [
  { id: 'new-york', name: 'New York', country: 'US', flag: '🇺🇸', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { id: 'london', name: 'London', country: 'GB', flag: '🇬🇧', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { id: 'barcelona', name: 'Barcelona', country: 'ES', flag: '🇪🇸', latitude: 41.3851, longitude: 2.1734, timezone: 'Europe/Madrid' },
  { id: 'oslo', name: 'Oslo', country: 'NO', flag: '🇳🇴', latitude: 59.9139, longitude: 10.7522, timezone: 'Europe/Oslo' },
];
