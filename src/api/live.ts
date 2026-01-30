// API client for /live page features
import { supabase } from '../lib/supabase';
import type {
  Community,
  CommunityWithDetails,
  CommunityMember,
  Message,
  CheckIn,
  CommunityTag,
  BubbleRoom,
  PinnedChat,
  TheaterContent,
  UserProfile,
  EventTag,
  RoomSize,
  PaginatedResponse,
  SendMessagePayload,
  UpdateBubblePayload,
  MemberRole,
} from '../types/live';

// ============================================
// COMMUNITIES
// ============================================

export const communitiesApi = {
  /**
   * Get all visible communities
   */
  async getAll(options?: {
    city?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Community[]> {
    let query = supabase
      .from('communities')
      .select('*')
      .eq('is_visible', true)
      .order('name');

    if (options?.city) {
      query = query.eq('city', options.city);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data?.map(mapCommunityFromDb) || [];
  },

  /**
   * Get community by ID with full details
   */
  async getById(id: string): Promise<CommunityWithDetails | null> {
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        community_tags(*),
        theater_content(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const community = mapCommunityFromDb(data);
    return {
      ...community,
      activeTags: data.community_tags?.map((t: any) => t.tag) || [],
      theater: data.theater_content?.[0] ? mapTheaterFromDb(data.theater_content[0]) : undefined,
    };
  },

  /**
   * Get community by slug
   */
  async getBySlug(slug: string): Promise<Community | null> {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data ? mapCommunityFromDb(data) : null;
  },

  /**
   * Get communities by city with member counts
   */
  async getByCity(city: string): Promise<Community[]> {
    const { data, error } = await supabase
      .rpc('get_communities_by_city', { city_name: city });

    if (error) {
      // Fallback if RPC doesn't exist yet
      return this.getAll({ city });
    }
    return data?.map(mapCommunityFromDb) || [];
  },

  /**
   * Get nearby communities by coordinates
   */
  async getNearby(lat: number, lng: number, radiusKm: number = 50): Promise<Community[]> {
    // Haversine formula approximation using bounding box
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('is_visible', true)
      .gte('latitude', lat - latDelta)
      .lte('latitude', lat + latDelta)
      .gte('longitude', lng - lngDelta)
      .lte('longitude', lng + lngDelta);

    if (error) throw error;
    return data?.map(mapCommunityFromDb) || [];
  },

  /**
   * Create a new community (admin only)
   */
  async create(community: Omit<Community, 'id' | 'createdAt' | 'updatedAt'>): Promise<Community> {
    const { data, error } = await supabase
      .from('communities')
      .insert(mapCommunityToDb(community))
      .select()
      .single();

    if (error) throw error;
    return mapCommunityFromDb(data);
  },

  /**
   * Update community (admin only)
   */
  async update(id: string, updates: Partial<Community>): Promise<Community> {
    const { data, error } = await supabase
      .from('communities')
      .update(mapCommunityToDb(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCommunityFromDb(data);
  },

  /**
   * Delete a community (admin only)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// MEMBERS
// ============================================

export const membersApi = {
  /**
   * Get members of a community
   */
  async getByCommumity(communityId: string): Promise<CommunityMember[]> {
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        *,
        user_live_profiles(*)
      `)
      .eq('community_id', communityId)
      .eq('is_banned', false)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data?.map(mapMemberFromDb) || [];
  },

  /**
   * Join a community
   */
  async join(communityId: string): Promise<CommunityMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
      })
      .select()
      .single();

    if (error) throw error;
    return mapMemberFromDb(data);
  },

  /**
   * Leave a community
   */
  async leave(communityId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Update member role (admin only)
   */
  async updateRole(communityId: string, userId: string, role: MemberRole): Promise<void> {
    const { error } = await supabase
      .from('community_members')
      .update({ role })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Ban a member (admin only)
   */
  async ban(communityId: string, userId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('community_members')
      .update({
        is_banned: true,
        ban_reason: reason,
      })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Remove a member from community (admin only)
   */
  async remove(communityId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};

// ============================================
// MESSAGES
// ============================================

export const messagesApi = {
  /**
   * Get messages for a community (paginated)
   */
  async getByCommumity(
    communityId: string,
    options?: { limit?: number; before?: string }
  ): Promise<PaginatedResponse<Message>> {
    let query = supabase
      .from('community_messages')
      .select(`
        *,
        user_live_profiles(*)
      `, { count: 'exact' })
      .eq('community_id', communityId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50);

    if (options?.before) {
      query = query.lt('created_at', options.before);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data?.map(mapMessageFromDb).reverse() || [],
      pagination: {
        page: 1,
        pageSize: options?.limit || 50,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (options?.limit || 50)),
      },
    };
  },

  /**
   * Send a message
   */
  async send(payload: SendMessagePayload): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        community_id: payload.communityId,
        user_id: user.id,
        content: payload.content,
        reply_to_id: payload.replyToId,
      })
      .select(`
        *,
        user_live_profiles(*)
      `)
      .single();

    if (error) throw error;
    return mapMessageFromDb(data);
  },

  /**
   * Edit a message
   */
  async edit(messageId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('community_messages')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return mapMessageFromDb(data);
  },

  /**
   * Delete a message (soft delete)
   */
  async delete(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('community_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
  },
};

// ============================================
// CHECK-INS / PRESENCE
// ============================================

export const presenceApi = {
  /**
   * Get active check-ins for a community
   */
  async getByCommumity(communityId: string): Promise<CheckIn[]> {
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        user_live_profiles(*)
      `)
      .eq('community_id', communityId)
      .eq('is_active', true)
      .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (error) throw error;
    return data?.map(mapCheckInFromDb) || [];
  },

  /**
   * Check in to a community
   */
  async checkIn(communityId: string): Promise<CheckIn> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check out from any existing check-ins first
    await this.checkOutAll();

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        community_id: communityId,
        user_id: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapCheckInFromDb(data);
  },

  /**
   * Check out from a community
   */
  async checkOut(communityId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('check_ins')
      .update({
        is_active: false,
        checked_out_at: new Date().toISOString(),
      })
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
  },

  /**
   * Check out from all communities
   */
  async checkOutAll(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('check_ins')
      .update({
        is_active: false,
        checked_out_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
  },

  /**
   * Send heartbeat to maintain presence
   */
  async heartbeat(communityId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('check_ins')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
  },

  /**
   * Get online count for a community
   */
  async getOnlineCount(communityId: string): Promise<number> {
    const { count, error } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .eq('is_active', true)
      .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (error) throw error;
    return count || 0;
  },
};

// ============================================
// TAGS
// ============================================

export const tagsApi = {
  /**
   * Get active tags for a community
   */
  async getByCommumity(communityId: string): Promise<CommunityTag[]> {
    const { data, error } = await supabase
      .from('community_tags')
      .select('*')
      .eq('community_id', communityId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error) throw error;
    return data?.map(mapTagFromDb) || [];
  },

  /**
   * Add a tag to a community
   */
  async add(communityId: string, tag: EventTag, expiresInMinutes?: number): Promise<CommunityTag> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const expiresAt = expiresInMinutes
      ? new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('community_tags')
      .upsert({
        community_id: communityId,
        tag,
        activated_by: user.id,
        activated_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    return mapTagFromDb(data);
  },

  /**
   * Remove a tag from a community
   */
  async remove(communityId: string, tag: EventTag): Promise<void> {
    const { error } = await supabase
      .from('community_tags')
      .delete()
      .eq('community_id', communityId)
      .eq('tag', tag);

    if (error) throw error;
  },
};

// ============================================
// MY BUBBLE
// ============================================

export const bubbleApi = {
  /**
   * Get user's bubble rooms
   */
  async get(): Promise<BubbleRoom[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_bubble_rooms')
      .select(`
        *,
        communities(*)
      `)
      .eq('user_id', user.id)
      .order('position');

    if (error) throw error;
    return data?.map(mapBubbleRoomFromDb) || [];
  },

  /**
   * Add room to bubble
   */
  async addRoom(communityId: string, size: RoomSize = 'medium'): Promise<BubbleRoom> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current max position
    const { data: existing } = await supabase
      .from('user_bubble_rooms')
      .select('position')
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = (existing?.[0]?.position || 0) + 1;

    const { data, error } = await supabase
      .from('user_bubble_rooms')
      .insert({
        user_id: user.id,
        community_id: communityId,
        position: nextPosition,
        size,
      })
      .select(`
        *,
        communities(*)
      `)
      .single();

    if (error) throw error;
    return mapBubbleRoomFromDb(data);
  },

  /**
   * Remove room from bubble
   */
  async removeRoom(communityId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_bubble_rooms')
      .delete()
      .eq('user_id', user.id)
      .eq('community_id', communityId);

    if (error) throw error;
  },

  /**
   * Update bubble (reorder, resize, pin)
   */
  async update(payload: UpdateBubblePayload): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update each room
    for (const room of payload.rooms) {
      const { error } = await supabase
        .from('user_bubble_rooms')
        .update({
          position: room.position,
          size: room.size,
          is_pinned: room.isPinned,
        })
        .eq('user_id', user.id)
        .eq('community_id', room.communityId);

      if (error) throw error;
    }
  },
};

// ============================================
// PINNED CHATS
// ============================================

export const pinnedChatsApi = {
  /**
   * Get user's pinned chats
   */
  async get(): Promise<PinnedChat[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_pinned_chats')
      .select(`
        *,
        communities(*)
      `)
      .eq('user_id', user.id)
      .order('position');

    if (error) throw error;
    return data?.map(mapPinnedChatFromDb) || [];
  },

  /**
   * Pin a chat
   */
  async pin(communityId: string): Promise<PinnedChat> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current max position
    const { data: existing } = await supabase
      .from('user_pinned_chats')
      .select('position')
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = (existing?.[0]?.position || 0) + 1;

    const { data, error } = await supabase
      .from('user_pinned_chats')
      .insert({
        user_id: user.id,
        community_id: communityId,
        position: nextPosition,
      })
      .select(`
        *,
        communities(*)
      `)
      .single();

    if (error) throw error;
    return mapPinnedChatFromDb(data);
  },

  /**
   * Unpin a chat
   */
  async unpin(communityId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_pinned_chats')
      .delete()
      .eq('user_id', user.id)
      .eq('community_id', communityId);

    if (error) throw error;
  },
};

// ============================================
// THEATER
// ============================================

export const theaterApi = {
  /**
   * Get theater content for a city
   */
  async getByCity(city: string): Promise<TheaterContent | null> {
    const { data, error } = await supabase
      .from('theater_content')
      .select('*')
      .eq('city', city)
      .eq('is_live', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ? mapTheaterFromDb(data) : null;
  },

  /**
   * Get theater content for a community
   */
  async getByCommunity(communityId: string): Promise<TheaterContent | null> {
    const { data, error } = await supabase
      .from('theater_content')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_live', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapTheaterFromDb(data) : null;
  },

  /**
   * Create or update theater content for a community (admin only)
   */
  async upsert(content: Omit<TheaterContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<TheaterContent> {
    const dbData = {
      community_id: content.communityId,
      city: content.city,
      type: content.type,
      title: content.title,
      subtitle: content.subtitle,
      thumbnail_url: content.thumbnailUrl,
      stream_url: content.streamUrl,
      white_player: content.whitePlayer,
      black_player: content.blackPlayer,
      white_rating: content.whiteRating,
      black_rating: content.blackRating,
      game_url: content.gameUrl,
      is_live: content.isLive,
      viewer_count: content.viewerCount,
      starts_at: content.startsAt,
      ends_at: content.endsAt,
      priority: content.priority,
    };

    const { data, error } = await supabase
      .from('theater_content')
      .upsert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapTheaterFromDb(data);
  },

  /**
   * Delete theater content (admin only)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('theater_content')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get all theater content for a community (including inactive)
   */
  async getAllByCommunity(communityId: string): Promise<TheaterContent[]> {
    const { data, error } = await supabase
      .from('theater_content')
      .select('*')
      .eq('community_id', communityId)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data?.map(mapTheaterFromDb) || [];
  },
};

// ============================================
// USER PROFILES
// ============================================

export const profilesApi = {
  /**
   * Get user profile
   */
  async get(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_live_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapProfileFromDb(data) : null;
  },

  /**
   * Get current user's profile
   */
  async getMe(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return this.get(user.id);
  },

  /**
   * Update user profile
   */
  async update(updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_live_profiles')
      .upsert({
        user_id: user.id,
        ...mapProfileToDb(updates),
      })
      .select()
      .single();

    if (error) throw error;
    return mapProfileFromDb(data);
  },
};

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapCommunityFromDb(data: any): Community {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    type: data.type,
    linkedEntityId: data.linked_entity_id,
    city: data.city,
    country: data.country,
    latitude: data.latitude ? parseFloat(data.latitude) : undefined,
    longitude: data.longitude ? parseFloat(data.longitude) : undefined,
    imageUrl: data.image_url,
    coverImageUrl: data.cover_image_url,
    isVisible: data.is_visible,
    isPublic: data.is_public,
    memberCount: data.member_count,
    onlineCount: data.online_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapCommunityToDb(data: Partial<Community>): any {
  const mapped: any = {};
  if (data.name !== undefined) mapped.name = data.name;
  if (data.slug !== undefined) mapped.slug = data.slug;
  if (data.description !== undefined) mapped.description = data.description;
  if (data.type !== undefined) mapped.type = data.type;
  if (data.linkedEntityId !== undefined) mapped.linked_entity_id = data.linkedEntityId;
  if (data.city !== undefined) mapped.city = data.city;
  if (data.country !== undefined) mapped.country = data.country;
  if (data.latitude !== undefined) mapped.latitude = data.latitude;
  if (data.longitude !== undefined) mapped.longitude = data.longitude;
  if (data.imageUrl !== undefined) mapped.image_url = data.imageUrl;
  if (data.coverImageUrl !== undefined) mapped.cover_image_url = data.coverImageUrl;
  if (data.isVisible !== undefined) mapped.is_visible = data.isVisible;
  if (data.isPublic !== undefined) mapped.is_public = data.isPublic;
  return mapped;
}

function mapMemberFromDb(data: any): CommunityMember {
  return {
    id: data.id,
    communityId: data.community_id,
    userId: data.user_id,
    role: data.role,
    isBanned: data.is_banned,
    banReason: data.ban_reason,
    bannedUntil: data.banned_until,
    joinedAt: data.joined_at,
    user: data.user_live_profiles ? mapProfileFromDb(data.user_live_profiles) : undefined,
  };
}

function mapMessageFromDb(data: any): Message {
  return {
    id: data.id,
    communityId: data.community_id,
    userId: data.user_id,
    content: data.content,
    replyToId: data.reply_to_id,
    isEdited: data.is_edited,
    isDeleted: data.is_deleted,
    createdAt: data.created_at,
    editedAt: data.edited_at,
    deletedAt: data.deleted_at,
    user: data.user_live_profiles ? mapProfileFromDb(data.user_live_profiles) : undefined,
  };
}

function mapCheckInFromDb(data: any): CheckIn {
  return {
    id: data.id,
    communityId: data.community_id,
    userId: data.user_id,
    isActive: data.is_active,
    checkedInAt: data.checked_in_at,
    checkedOutAt: data.checked_out_at,
    lastHeartbeat: data.last_heartbeat,
    user: data.user_live_profiles ? mapProfileFromDb(data.user_live_profiles) : undefined,
  };
}

function mapTagFromDb(data: any): CommunityTag {
  return {
    id: data.id,
    communityId: data.community_id,
    tag: data.tag,
    activatedBy: data.activated_by,
    activatedAt: data.activated_at,
    expiresAt: data.expires_at,
  };
}

function mapBubbleRoomFromDb(data: any): BubbleRoom {
  return {
    id: data.id,
    userId: data.user_id,
    communityId: data.community_id,
    position: data.position,
    size: data.size,
    isPinned: data.is_pinned,
    addedAt: data.added_at,
    community: data.communities ? mapCommunityFromDb(data.communities) : undefined,
  };
}

function mapPinnedChatFromDb(data: any): PinnedChat {
  return {
    id: data.id,
    userId: data.user_id,
    communityId: data.community_id,
    position: data.position,
    pinnedAt: data.pinned_at,
    community: data.communities ? mapCommunityFromDb(data.communities) : undefined,
  };
}

function mapTheaterFromDb(data: any): TheaterContent {
  return {
    id: data.id,
    communityId: data.community_id,
    city: data.city,
    type: data.type,
    title: data.title,
    subtitle: data.subtitle,
    thumbnailUrl: data.thumbnail_url,
    streamUrl: data.stream_url,
    whitePlayer: data.white_player,
    blackPlayer: data.black_player,
    whiteRating: data.white_rating,
    blackRating: data.black_rating,
    gameUrl: data.game_url,
    isLive: data.is_live,
    viewerCount: data.viewer_count,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    priority: data.priority,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapProfileFromDb(data: any): UserProfile {
  return {
    id: data.id,
    userId: data.user_id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    chessRating: data.chess_rating,
    chessTitle: data.chess_title,
    lichessUsername: data.lichess_username,
    chesscomUsername: data.chesscom_username,
    homeCity: data.home_city,
    homeCountry: data.home_country,
    showOnlineStatus: data.show_online_status,
    showLocation: data.show_location,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapProfileToDb(data: Partial<UserProfile>): any {
  const mapped: any = {};
  if (data.displayName !== undefined) mapped.display_name = data.displayName;
  if (data.avatarUrl !== undefined) mapped.avatar_url = data.avatarUrl;
  if (data.chessRating !== undefined) mapped.chess_rating = data.chessRating;
  if (data.chessTitle !== undefined) mapped.chess_title = data.chessTitle;
  if (data.lichessUsername !== undefined) mapped.lichess_username = data.lichessUsername;
  if (data.chesscomUsername !== undefined) mapped.chesscom_username = data.chesscomUsername;
  if (data.homeCity !== undefined) mapped.home_city = data.homeCity;
  if (data.homeCountry !== undefined) mapped.home_country = data.homeCountry;
  if (data.showOnlineStatus !== undefined) mapped.show_online_status = data.showOnlineStatus;
  if (data.showLocation !== undefined) mapped.show_location = data.showLocation;
  return mapped;
}
