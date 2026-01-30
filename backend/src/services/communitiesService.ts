import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors';

// Main bubble cities with their coordinates
const BUBBLE_CITIES = {
  'new-york': { name: 'New York', lat: 40.7128, lng: -74.0060 },
  'london': { name: 'London', lat: 51.5074, lng: -0.1278 },
  'barcelona': { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  'oslo': { name: 'Oslo', lat: 59.9139, lng: 10.7522 },
} as const;

type BubbleId = keyof typeof BUBBLE_CITIES | 'rest-of-world';

// Haversine formula to calculate distance between two coordinates in km
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find the nearest bubble city based on coordinates or city/country name
export const findNearestBubble = (options: {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}): BubbleId => {
  const { latitude, longitude, city, country } = options;

  // First try to match by city name
  if (city) {
    const lower = city.toLowerCase();
    if (lower.includes('new york') || lower.includes('nyc') || lower === 'ny') return 'new-york';
    if (lower.includes('london')) return 'london';
    if (lower.includes('barcelona')) return 'barcelona';
    if (lower.includes('oslo')) return 'oslo';
  }

  // If we have coordinates, find the nearest bubble
  if (latitude !== undefined && longitude !== undefined) {
    let nearestBubble: BubbleId = 'rest-of-world';
    let minDistance = Infinity;

    for (const [bubbleId, coords] of Object.entries(BUBBLE_CITIES)) {
      const distance = haversineDistance(latitude, longitude, coords.lat, coords.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestBubble = bubbleId as BubbleId;
      }
    }

    // If the nearest bubble is more than 2000km away, use country-based fallback
    if (minDistance > 2000) {
      return getCountryBubble(country) || nearestBubble;
    }

    return nearestBubble;
  }

  // Fall back to country-based assignment
  return getCountryBubble(country) || 'rest-of-world';
};

// Get bubble based on country
const getCountryBubble = (country?: string): BubbleId | null => {
  if (!country) return null;
  const lower = country.toLowerCase();

  // US cities go to New York
  if (['us', 'usa', 'united states'].includes(lower)) return 'new-york';
  // UK cities go to London
  if (['gb', 'uk', 'united kingdom', 'england', 'scotland', 'wales'].includes(lower)) return 'london';
  // Spanish cities go to Barcelona
  if (['es', 'spain', 'españa'].includes(lower)) return 'barcelona';
  // Scandinavian cities go to Oslo
  if (['no', 'norway', 'se', 'sweden', 'dk', 'denmark', 'fi', 'finland', 'is', 'iceland'].includes(lower)) return 'oslo';
  // Western European cities go to nearest major hub
  if (['fr', 'france', 'de', 'germany', 'nl', 'netherlands', 'be', 'belgium'].includes(lower)) return 'london';
  // Southern European cities go to Barcelona
  if (['it', 'italy', 'pt', 'portugal', 'gr', 'greece'].includes(lower)) return 'barcelona';

  return null;
};

// Helper to check if communities tables exist
let tablesExist: boolean | null = null;

async function checkTablesExist(): Promise<boolean> {
  if (tablesExist !== null) return tablesExist;

  try {
    await query(`SELECT 1 FROM communities LIMIT 1`);
    tablesExist = true;
    return true;
  } catch (error: any) {
    if (error.code === '42P01') { // Table doesn't exist
      console.warn('Communities tables not found. Run migrations/001_create_communities.sql');
      tablesExist = false;
      return false;
    }
    throw error;
  }
}

// Mock data when tables don't exist
const mockCommunities: CommunityWithDetails[] = [
  {
    id: 1,
    name: 'Marshall Chess Club',
    slug: 'marshall-chess-club',
    description: 'Historic chess club in Greenwich Village',
    type: 'club',
    city: 'New York',
    country: 'US',
    latitude: 40.7336,
    longitude: -74.0027,
    tags: ['classical', 'tournament-live', 'gm-present'],
    is_active: true,
    is_verified: true,
    is_private: false,
    member_count: 250,
    online_count: 12,
    created_at: new Date(),
    updated_at: new Date(),
    metadata: {},
  },
  {
    id: 2,
    name: 'Washington Square Park',
    slug: 'washington-square-park',
    description: 'Famous outdoor chess spot',
    type: 'venue',
    city: 'New York',
    country: 'US',
    latitude: 40.7308,
    longitude: -73.9973,
    tags: ['blitz', 'rapid', 'open-play'],
    is_active: true,
    is_verified: true,
    is_private: false,
    member_count: 500,
    online_count: 28,
    created_at: new Date(),
    updated_at: new Date(),
    metadata: {},
  },
  {
    id: 3,
    name: 'Chess Forum',
    slug: 'chess-forum',
    description: 'Iconic chess shop with playing area',
    type: 'venue',
    city: 'New York',
    country: 'US',
    latitude: 40.7324,
    longitude: -73.9985,
    tags: ['rapid', 'lesson'],
    is_active: true,
    is_verified: false,
    is_private: false,
    member_count: 120,
    online_count: 5,
    created_at: new Date(),
    updated_at: new Date(),
    metadata: {},
  },
  {
    id: 4,
    name: 'London Chess Centre',
    slug: 'london-chess-centre',
    description: 'Premier chess venue in London',
    type: 'venue',
    city: 'London',
    country: 'GB',
    latitude: 51.5155,
    longitude: -0.1411,
    tags: ['classical', 'tournament-live'],
    is_active: true,
    is_verified: true,
    is_private: false,
    member_count: 180,
    online_count: 8,
    created_at: new Date(),
    updated_at: new Date(),
    metadata: {},
  },
  {
    id: 5,
    name: 'Barcelona Chess Club',
    slug: 'barcelona-chess-club',
    description: 'Historic club in Barcelona',
    type: 'club',
    city: 'Barcelona',
    country: 'ES',
    latitude: 41.3851,
    longitude: 2.1734,
    tags: ['rapid', 'blitz', 'gm-present'],
    is_active: true,
    is_verified: true,
    is_private: false,
    member_count: 200,
    online_count: 15,
    created_at: new Date(),
    updated_at: new Date(),
    metadata: {},
  },
];

export interface Community {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'venue' | 'club' | 'tournament' | 'online' | 'city';
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  image?: string;
  banner_image?: string;
  owner_id?: number;
  is_active: boolean;
  is_verified: boolean;
  is_private: boolean;
  member_count: number;
  max_members?: number;
  tags: string[];
  metadata: Record<string, any>;
  parent_bubble?: string; // Which main city bubble this community belongs to
  created_at: Date;
  updated_at: Date;
}

export interface CommunityWithDetails extends Community {
  owner_name?: string;
  online_count?: number;
  user_role?: string;
  is_member?: boolean;
}

export interface CommunityMessage {
  id: number;
  community_id: number;
  user_id: number;
  content: string;
  message_type: string;
  reply_to_id?: number;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  user_name?: string;
  user_avatar?: string;
}

export interface UserPresence {
  id: number;
  user_id: number;
  community_id?: number;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen_at: Date;
  checked_in_at?: Date;
  metadata: Record<string, any>;
}

// ============ COMMUNITIES ============

export const getCommunities = async (filters: {
  city?: string;
  country?: string;
  type?: string;
  tags?: string[];
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  userId?: number;
}): Promise<{ communities: CommunityWithDetails[]; total: number }> => {
  // Check if tables exist, return mock data if not
  if (!(await checkTablesExist())) {
    const { city, type, search, page = 1, limit = 20 } = filters;
    let filtered = [...mockCommunities];

    if (city) {
      filtered = filtered.filter(c => c.city?.toLowerCase() === city.toLowerCase());
    }
    if (type) {
      filtered = filtered.filter(c => c.type === type);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(s) ||
        c.description?.toLowerCase().includes(s)
      );
    }

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    return { communities: paginated, total: filtered.length };
  }

  const {
    city, country, type, tags, is_active = true, search,
    page = 1, limit = 20, userId
  } = filters;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (is_active !== undefined) {
    whereClause += ` AND c.is_active = $${paramIndex++}`;
    params.push(is_active);
  }

  if (city) {
    whereClause += ` AND LOWER(c.city) = LOWER($${paramIndex++})`;
    params.push(city);
  }

  if (country) {
    whereClause += ` AND LOWER(c.country) = LOWER($${paramIndex++})`;
    params.push(country);
  }

  if (type) {
    whereClause += ` AND c.type = $${paramIndex++}`;
    params.push(type);
  }

  if (tags && tags.length > 0) {
    whereClause += ` AND c.tags && $${paramIndex++}`;
    params.push(tags);
  }

  if (search) {
    // Fuzzy search using pg_trgm similarity (handles typos and partial matches)
    // Very generous threshold (0.1) and space-insensitive matching
    whereClause += ` AND (
      similarity(c.name, $${paramIndex}) > 0.1 OR
      similarity(COALESCE(c.description, ''), $${paramIndex}) > 0.1 OR
      word_similarity($${paramIndex}, c.name) > 0.2 OR
      similarity(REPLACE(LOWER(c.name), ' ', ''), REPLACE(LOWER($${paramIndex}), ' ', '')) > 0.3 OR
      c.name ILIKE $${paramIndex + 1} OR
      COALESCE(c.description, '') ILIKE $${paramIndex + 1}
    )`;
    params.push(search, `%${search}%`);
    paramIndex += 2;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM communities c ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get online count from presence table
  const result = await query(
    `SELECT c.*,
            u.name as owner_name,
            (SELECT COUNT(*) FROM user_presence up
             WHERE up.community_id = c.id
             AND up.last_seen_at > NOW() - INTERVAL '5 minutes') as online_count
            ${userId ? `,
            (SELECT role FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = $${paramIndex}) as user_role,
            EXISTS(SELECT 1 FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = $${paramIndex} AND cm.status = 'active') as is_member` : ''}
            ${search ? `,
            GREATEST(
              similarity(c.name, $${paramIndex - (userId ? 2 : 2)}),
              similarity(COALESCE(c.description, ''), $${paramIndex - (userId ? 2 : 2)}),
              word_similarity($${paramIndex - (userId ? 2 : 2)}, c.name),
              similarity(REPLACE(LOWER(c.name), ' ', ''), REPLACE(LOWER($${paramIndex - (userId ? 2 : 2)}), ' ', ''))
            ) as search_rank` : ''}
     FROM communities c
     LEFT JOIN users u ON c.owner_id = u.id
     ${whereClause}
     ORDER BY ${search ? 'search_rank DESC,' : ''} c.member_count DESC, c.created_at DESC
     LIMIT $${paramIndex + (userId ? 1 : 0)} OFFSET $${paramIndex + (userId ? 2 : 1)}`,
    userId ? [...params, userId, limit, offset] : [...params, limit, offset]
  );

  return { communities: result.rows, total };
};

export const getCommunityById = async (id: number, userId?: number): Promise<CommunityWithDetails> => {
  const result = await query(
    `SELECT c.*,
            u.name as owner_name,
            (SELECT COUNT(*) FROM user_presence up
             WHERE up.community_id = c.id
             AND up.last_seen_at > NOW() - INTERVAL '5 minutes') as online_count
            ${userId ? `,
            (SELECT role FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = $2) as user_role,
            EXISTS(SELECT 1 FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = $2 AND cm.status = 'active') as is_member` : ''}
     FROM communities c
     LEFT JOIN users u ON c.owner_id = u.id
     WHERE c.id = $1`,
    userId ? [id, userId] : [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Community not found');
  }

  return result.rows[0];
};

export const getCommunityBySlug = async (slug: string, userId?: number): Promise<CommunityWithDetails> => {
  const result = await query(
    `SELECT c.*,
            u.name as owner_name,
            (SELECT COUNT(*) FROM user_presence up
             WHERE up.community_id = c.id
             AND up.last_seen_at > NOW() - INTERVAL '5 minutes') as online_count
            ${userId ? `,
            (SELECT role FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = $2) as user_role,
            EXISTS(SELECT 1 FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = $2 AND cm.status = 'active') as is_member` : ''}
     FROM communities c
     LEFT JOIN users u ON c.owner_id = u.id
     WHERE c.slug = $1`,
    userId ? [slug, userId] : [slug]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Community not found');
  }

  return result.rows[0];
};

export const getCommunitiesByCity = async (city: string): Promise<CommunityWithDetails[]> => {
  const result = await query(
    `SELECT c.*,
            u.name as owner_name,
            (SELECT COUNT(*) FROM user_presence up
             WHERE up.community_id = c.id
             AND up.last_seen_at > NOW() - INTERVAL '5 minutes') as online_count
     FROM communities c
     LEFT JOIN users u ON c.owner_id = u.id
     WHERE LOWER(c.city) = LOWER($1) AND c.is_active = true
     ORDER BY c.member_count DESC`,
    [city]
  );

  return result.rows;
};

// Get the city-level general chat community for a specific city
export const getCityGeneralChat = async (city: string): Promise<CommunityWithDetails | null> => {
  const result = await query(
    `SELECT c.*,
            u.name as owner_name,
            (SELECT COUNT(*) FROM user_presence up
             WHERE up.community_id = c.id
             AND up.last_seen_at > NOW() - INTERVAL '5 minutes') as online_count
     FROM communities c
     LEFT JOIN users u ON c.owner_id = u.id
     WHERE LOWER(c.city) = LOWER($1) AND c.type = 'city' AND c.is_active = true
     LIMIT 1`,
    [city]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

export const createCommunity = async (
  ownerId: number,
  input: {
    name: string;
    description?: string;
    type: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    image?: string;
    tags?: string[];
    is_private?: boolean;
    max_members?: number;
  }
): Promise<Community | null> => {
  // Check if communities table exists, skip if not
  if (!(await checkTablesExist())) {
    console.warn('Communities table does not exist, skipping community creation');
    return null;
  }

  const { name, description, type, city, country, latitude, longitude, image, tags, is_private, max_members } = input;

  if (!name) {
    throw new ValidationError('Community name is required');
  }

  // Generate slug from name
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug = baseSlug;
  let counter = 1;

  // Ensure unique slug
  while (true) {
    const existing = await query('SELECT id FROM communities WHERE slug = $1', [slug]);
    if (existing.rows.length === 0) break;
    slug = `${baseSlug}-${counter++}`;
  }

  // Automatically assign to nearest bubble city
  const parentBubble = findNearestBubble({ latitude, longitude, city, country });

  const result = await query(
    `INSERT INTO communities (
       name, slug, description, type, city, country, latitude, longitude,
       image, tags, is_private, max_members, owner_id, member_count, parent_bubble
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, $14)
     RETURNING *`,
    [name, slug, description, type || 'venue', city, country, latitude, longitude,
     image, tags || [], is_private || false, max_members, ownerId, parentBubble]
  );

  console.log(`[Communities] Created "${name}" in ${city || 'unknown city'}, assigned to bubble: ${parentBubble}`);

  // Add owner as first member
  await query(
    `INSERT INTO community_members (community_id, user_id, role)
     VALUES ($1, $2, 'owner')`,
    [result.rows[0].id, ownerId]
  );

  return result.rows[0];
};

export const updateCommunity = async (
  id: number,
  userId: number,
  input: Partial<{
    name: string;
    description: string;
    type: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    image: string;
    banner_image: string;
    tags: string[];
    is_private: boolean;
    is_active: boolean;
    max_members: number;
    metadata: Record<string, any>;
  }>
): Promise<Community> => {
  // Check if user has permission
  const membershipResult = await query(
    `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
    [id, userId]
  );

  const membership = membershipResult.rows[0];
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new ForbiddenError('Only community owners or admins can update the community');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = [
    'name', 'description', 'type', 'city', 'country', 'latitude', 'longitude',
    'image', 'banner_image', 'tags', 'is_private', 'is_active', 'max_members', 'metadata'
  ];

  for (const field of fields) {
    if (input[field as keyof typeof input] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(input[field as keyof typeof input]);
    }
  }

  if (updates.length === 0) {
    return getCommunityById(id);
  }

  values.push(id);

  const result = await query(
    `UPDATE communities SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

// ============ COMMUNITY MEMBERS ============

export const joinCommunity = async (communityId: number, userId: number): Promise<void> => {
  const community = await getCommunityById(communityId);

  if (!community.is_active) {
    throw new ValidationError('This community is not accepting new members');
  }

  if (community.max_members && community.member_count >= community.max_members) {
    throw new ValidationError('This community has reached its member limit');
  }

  // Check if already a member
  const existing = await query(
    `SELECT id, status FROM community_members WHERE community_id = $1 AND user_id = $2`,
    [communityId, userId]
  );

  if (existing.rows.length > 0) {
    if (existing.rows[0].status === 'active') {
      throw new ConflictError('You are already a member of this community');
    }
    if (existing.rows[0].status === 'banned') {
      throw new ForbiddenError('You are banned from this community');
    }
    // Reactivate
    await query(
      `UPDATE community_members SET status = 'active', joined_at = NOW()
       WHERE community_id = $1 AND user_id = $2`,
      [communityId, userId]
    );
  } else {
    await query(
      `INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)`,
      [communityId, userId]
    );
  }

  // Update member count
  await query(
    `UPDATE communities SET member_count = (
       SELECT COUNT(*) FROM community_members WHERE community_id = $1 AND status = 'active'
     ) WHERE id = $1`,
    [communityId]
  );
};

export const leaveCommunity = async (communityId: number, userId: number): Promise<void> => {
  const membershipResult = await query(
    `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2 AND status = 'active'`,
    [communityId, userId]
  );

  if (membershipResult.rows.length === 0) {
    throw new NotFoundError('You are not a member of this community');
  }

  if (membershipResult.rows[0].role === 'owner') {
    throw new ValidationError('Community owner cannot leave. Transfer ownership first.');
  }

  await query(
    `UPDATE community_members SET status = 'inactive' WHERE community_id = $1 AND user_id = $2`,
    [communityId, userId]
  );

  await query(
    `UPDATE communities SET member_count = (
       SELECT COUNT(*) FROM community_members WHERE community_id = $1 AND status = 'active'
     ) WHERE id = $1`,
    [communityId]
  );
};

export const getCommunityMembers = async (
  communityId: number,
  page: number = 1,
  limit: number = 50
): Promise<{ members: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM community_members WHERE community_id = $1 AND status = 'active'`,
    [communityId]
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT cm.*, u.name, u.rating, u.avatar,
            (up.last_seen_at > NOW() - INTERVAL '5 minutes') as is_online
     FROM community_members cm
     JOIN users u ON cm.user_id = u.id
     LEFT JOIN user_presence up ON up.user_id = u.id AND up.community_id = cm.community_id
     WHERE cm.community_id = $1 AND cm.status = 'active'
     ORDER BY
       (up.last_seen_at > NOW() - INTERVAL '5 minutes') DESC,
       CASE cm.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'moderator' THEN 3
         ELSE 4
       END,
       cm.joined_at ASC
     LIMIT $2 OFFSET $3`,
    [communityId, limit, offset]
  );

  return { members: result.rows, total };
};

export const getUserCommunities = async (userId: number): Promise<CommunityWithDetails[]> => {
  const result = await query(
    `SELECT c.*,
            cm.role as user_role,
            cm.joined_at as user_joined_at,
            (SELECT COUNT(*) FROM user_presence up
             WHERE up.community_id = c.id
             AND up.last_seen_at > NOW() - INTERVAL '5 minutes') as online_count
     FROM communities c
     JOIN community_members cm ON c.id = cm.community_id
     WHERE cm.user_id = $1 AND cm.status = 'active'
     ORDER BY cm.joined_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getUserOwnedCommunities = async (userId: number): Promise<CommunityWithDetails[]> => {
  console.log(`[getUserOwnedCommunities] Fetching communities for user ID: ${userId}`);
  const result = await query(
    `SELECT c.*,
            'owner' as user_role,
            c.created_at as user_joined_at,
            (SELECT COUNT(*) FROM user_presence up
             WHERE up.community_id = c.id
             AND up.last_seen_at > NOW() - INTERVAL '5 minutes') as online_count
     FROM communities c
     WHERE c.owner_id = $1 AND c.is_active = true
     ORDER BY c.created_at DESC`,
    [userId]
  );

  console.log(`[getUserOwnedCommunities] Found ${result.rows.length} owned communities for user ${userId}`);
  if (result.rows.length > 0) {
    console.log(`[getUserOwnedCommunities] Communities:`, result.rows.map(c => ({ id: c.id, name: c.name, type: c.type, owner_id: c.owner_id })));
  }

  return result.rows;
};

// ============ MESSAGES ============

export const getCommunityMessages = async (
  communityId: number,
  options: { limit?: number; before?: number; after?: number }
): Promise<CommunityMessage[]> => {
  const { limit = 50, before, after } = options;

  let whereClause = 'WHERE cm.community_id = $1 AND cm.is_deleted = false';
  const params: any[] = [communityId];
  let paramIndex = 2;

  if (before) {
    whereClause += ` AND cm.id < $${paramIndex++}`;
    params.push(before);
  }

  if (after) {
    whereClause += ` AND cm.id > $${paramIndex++}`;
    params.push(after);
  }

  params.push(limit);

  const result = await query(
    `SELECT cm.*, u.name as user_name, u.avatar as user_avatar
     FROM community_messages cm
     JOIN users u ON cm.user_id = u.id
     ${whereClause}
     ORDER BY cm.created_at ${after ? 'ASC' : 'DESC'}
     LIMIT $${paramIndex}`,
    params
  );

  // Return in chronological order
  return after ? result.rows : result.rows.reverse();
};

export const createMessage = async (
  communityId: number,
  userId: number,
  content: string,
  messageType: string = 'text',
  replyToId?: number
): Promise<CommunityMessage> => {
  // Check if user is a member
  const membershipResult = await query(
    `SELECT status FROM community_members WHERE community_id = $1 AND user_id = $2`,
    [communityId, userId]
  );

  if (membershipResult.rows.length === 0 || membershipResult.rows[0].status !== 'active') {
    throw new ForbiddenError('You must be a member to send messages');
  }

  if (membershipResult.rows[0].status === 'muted') {
    throw new ForbiddenError('You are muted in this community');
  }

  const result = await query(
    `INSERT INTO community_messages (community_id, user_id, content, message_type, reply_to_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [communityId, userId, content, messageType, replyToId]
  );

  // Get user info
  const userResult = await query(
    `SELECT name, avatar FROM users WHERE id = $1`,
    [userId]
  );

  return {
    ...result.rows[0],
    user_name: userResult.rows[0]?.name,
    user_avatar: userResult.rows[0]?.avatar
  };
};

export const deleteMessage = async (messageId: number, userId: number): Promise<void> => {
  const messageResult = await query(
    `SELECT cm.*, comm.owner_id, mem.role
     FROM community_messages cm
     JOIN communities comm ON cm.community_id = comm.id
     LEFT JOIN community_members mem ON mem.community_id = cm.community_id AND mem.user_id = $2
     WHERE cm.id = $1`,
    [messageId, userId]
  );

  if (messageResult.rows.length === 0) {
    throw new NotFoundError('Message not found');
  }

  const message = messageResult.rows[0];

  // Check permission: message author, community owner, admin, or moderator
  const canDelete = message.user_id === userId ||
    message.owner_id === userId ||
    ['owner', 'admin', 'moderator'].includes(message.role);

  if (!canDelete) {
    throw new ForbiddenError('You do not have permission to delete this message');
  }

  await query(
    `UPDATE community_messages SET is_deleted = true WHERE id = $1`,
    [messageId]
  );
};

// ============ PRESENCE ============

export const updatePresence = async (
  userId: number,
  communityId?: number,
  status: 'online' | 'away' | 'busy' | 'offline' = 'online'
): Promise<void> => {
  if (communityId) {
    await query(
      `INSERT INTO user_presence (user_id, community_id, status, last_seen_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, community_id)
       DO UPDATE SET status = $3, last_seen_at = NOW()`,
      [userId, communityId, status]
    );
  } else {
    // Update global presence (null community_id)
    await query(
      `INSERT INTO user_presence (user_id, community_id, status, last_seen_at)
       VALUES ($1, NULL, $2, NOW())
       ON CONFLICT (user_id, community_id)
       DO UPDATE SET status = $2, last_seen_at = NOW()`,
      [userId, status]
    );
  }
};

export const checkIn = async (userId: number, communityId: number): Promise<void> => {
  // Verify community exists
  await getCommunityById(communityId);

  await query(
    `INSERT INTO user_presence (user_id, community_id, status, last_seen_at, checked_in_at)
     VALUES ($1, $2, 'online', NOW(), NOW())
     ON CONFLICT (user_id, community_id)
     DO UPDATE SET status = 'online', last_seen_at = NOW(), checked_in_at = NOW()`,
    [userId, communityId]
  );
};

export const checkOut = async (userId: number, communityId: number): Promise<void> => {
  await query(
    `UPDATE user_presence
     SET status = 'offline', checked_in_at = NULL
     WHERE user_id = $1 AND community_id = $2`,
    [userId, communityId]
  );
};

export const getOnlineUsers = async (communityId: number): Promise<any[]> => {
  const result = await query(
    `SELECT up.*, u.name, u.avatar, u.rating
     FROM user_presence up
     JOIN users u ON up.user_id = u.id
     WHERE up.community_id = $1
     AND up.last_seen_at > NOW() - INTERVAL '5 minutes'
     ORDER BY up.last_seen_at DESC`,
    [communityId]
  );

  return result.rows;
};

export const getCityStats = async (): Promise<{ city: string; online_count: number; community_count: number }[]> => {
  // Return mock stats if tables don't exist
  if (!(await checkTablesExist())) {
    const cityMap = new Map<string, { online_count: number; community_count: number }>();
    for (const c of mockCommunities) {
      if (c.city) {
        const existing = cityMap.get(c.city) || { online_count: 0, community_count: 0 };
        existing.community_count++;
        existing.online_count += c.online_count || 0;
        cityMap.set(c.city, existing);
      }
    }
    return Array.from(cityMap.entries()).map(([city, stats]) => ({
      city,
      ...stats
    })).sort((a, b) => b.online_count - a.online_count);
  }

  const result = await query(
    `SELECT c.city,
            COUNT(DISTINCT c.id) as community_count,
            COUNT(DISTINCT up.user_id) FILTER (WHERE up.last_seen_at > NOW() - INTERVAL '5 minutes') as online_count
     FROM communities c
     LEFT JOIN user_presence up ON up.community_id = c.id
     WHERE c.is_active = true AND c.city IS NOT NULL
     GROUP BY c.city
     ORDER BY online_count DESC`
  );

  return result.rows;
};

// ============ THEATER CONTENT ============

export const getTheaterContent = async (communityId: number): Promise<any | null> => {
  const result = await query(
    `SELECT * FROM theater_content
     WHERE community_id = $1 AND is_live = true
     ORDER BY priority DESC, created_at DESC
     LIMIT 1`,
    [communityId]
  );

  return result.rows[0] || null;
};

export const getAllTheaterContent = async (communityId: number): Promise<any[]> => {
  const result = await query(
    `SELECT * FROM theater_content
     WHERE community_id = $1
     ORDER BY priority DESC, created_at DESC`,
    [communityId]
  );

  return result.rows;
};

export const upsertTheaterContent = async (
  communityId: number,
  userId: number,
  data: {
    type: string;
    title: string;
    subtitle?: string;
    thumbnail_url?: string;
    stream_url?: string;
    white_player?: string;
    black_player?: string;
    white_rating?: number;
    black_rating?: number;
    game_url?: string;
    is_live?: boolean;
    viewer_count?: number;
    starts_at?: string;
    ends_at?: string;
    priority?: number;
  }
): Promise<any> => {
  // Check if user has permission (community owner or admin)
  const membershipResult = await query(
    `SELECT cm.role, c.owner_id
     FROM community_members cm
     JOIN communities c ON c.id = cm.community_id
     WHERE cm.community_id = $1 AND cm.user_id = $2 AND cm.status = 'active'`,
    [communityId, userId]
  );

  if (membershipResult.rows.length === 0) {
    throw new ForbiddenError('You must be a member of this community');
  }

  const { role, owner_id } = membershipResult.rows[0];
  if (userId !== owner_id && !['owner', 'admin'].includes(role)) {
    throw new ForbiddenError('Only community owners and admins can manage theater content');
  }

  const result = await query(
    `INSERT INTO theater_content (
       community_id, type, title, subtitle, thumbnail_url, stream_url,
       white_player, black_player, white_rating, black_rating, game_url,
       is_live, viewer_count, starts_at, ends_at, priority
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      communityId,
      data.type,
      data.title,
      data.subtitle,
      data.thumbnail_url,
      data.stream_url,
      data.white_player,
      data.black_player,
      data.white_rating,
      data.black_rating,
      data.game_url,
      data.is_live ?? true,
      data.viewer_count ?? 0,
      data.starts_at,
      data.ends_at,
      data.priority ?? 0
    ]
  );

  return result.rows[0];
};

export const deleteTheaterContent = async (
  communityId: number,
  contentId: number,
  userId: number
): Promise<void> => {
  // Check if user has permission
  const membershipResult = await query(
    `SELECT cm.role, c.owner_id
     FROM community_members cm
     JOIN communities c ON c.id = cm.community_id
     WHERE cm.community_id = $1 AND cm.user_id = $2 AND cm.status = 'active'`,
    [communityId, userId]
  );

  if (membershipResult.rows.length === 0) {
    throw new ForbiddenError('You must be a member of this community');
  }

  const { role, owner_id } = membershipResult.rows[0];
  if (userId !== owner_id && !['owner', 'admin'].includes(role)) {
    throw new ForbiddenError('Only community owners and admins can manage theater content');
  }

  const result = await query(
    `DELETE FROM theater_content WHERE id = $1 AND community_id = $2 RETURNING id`,
    [contentId, communityId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Theater content not found');
  }
};
