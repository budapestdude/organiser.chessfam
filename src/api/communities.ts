// Communities API - Uses Express backend (PostgreSQL)
import apiClient from './client';

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
  created_at: string;
  updated_at: string;
  // Extended fields
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
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface CommunityMember {
  id: number;
  community_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  status: 'active' | 'banned' | 'muted' | 'pending';
  joined_at: string;
  last_active_at?: string;
  name?: string;
  avatar?: string;
  rating?: number;
  is_online?: boolean;
}

export interface CityStats {
  city: string;
  online_count: number;
  community_count: number;
}

export interface CommunitiesFilters {
  city?: string;
  country?: string;
  type?: string;
  tags?: string[];
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ============ COMMUNITIES ============

export const communitiesApi = {
  // Get all communities with filters
  getAll: async (filters: CommunitiesFilters = {}): Promise<{ communities: Community[]; total: number }> => {
    const params = new URLSearchParams();

    if (filters.city) params.append('city', filters.city);
    if (filters.country) params.append('country', filters.country);
    if (filters.type) params.append('type', filters.type);
    if (filters.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get(`/communities?${params.toString()}`);
    return response.data.data;
  },

  // Get community by ID
  getById: async (id: number): Promise<Community> => {
    const response = await apiClient.get(`/communities/${id}`);
    return response.data.data;
  },

  // Get community by slug
  getBySlug: async (slug: string): Promise<Community> => {
    const response = await apiClient.get(`/communities/slug/${slug}`);
    return response.data.data;
  },

  // Get communities by city
  getByCity: async (city: string): Promise<Community[]> => {
    const response = await apiClient.get(`/communities/city/${encodeURIComponent(city)}`);
    return response.data.data;
  },

  // Get city stats (for bubble counts)
  getCityStats: async (): Promise<CityStats[]> => {
    const response = await apiClient.get('/communities/stats/cities');
    return response.data.data;
  },

  // Create community
  create: async (data: {
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
  }): Promise<Community> => {
    const response = await apiClient.post('/communities', data);
    return response.data.data;
  },

  // Update community
  update: async (id: number, data: Partial<Community>): Promise<Community> => {
    const response = await apiClient.put(`/communities/${id}`, data);
    return response.data.data;
  },

  // ============ MEMBERS ============

  // Join community
  join: async (id: number): Promise<void> => {
    await apiClient.post(`/communities/${id}/join`);
  },

  // Leave community
  leave: async (id: number): Promise<void> => {
    await apiClient.delete(`/communities/${id}/leave`);
  },

  // Get community members
  getMembers: async (id: number, page = 1, limit = 50): Promise<{ members: CommunityMember[]; total: number }> => {
    const response = await apiClient.get(`/communities/${id}/members?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Get user's communities
  getUserCommunities: async (): Promise<Community[]> => {
    const response = await apiClient.get('/communities/user/memberships');
    return response.data.data;
  },

  // Get communities user owns (created)
  getUserOwnedCommunities: async (): Promise<Community[]> => {
    const response = await apiClient.get('/communities/user/owned');
    return response.data.data;
  },

  // ============ MESSAGES ============

  // Get community messages
  getMessages: async (id: number, options: { limit?: number; before?: number; after?: number } = {}): Promise<CommunityMessage[]> => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.before) params.append('before', String(options.before));
    if (options.after) params.append('after', String(options.after));

    const response = await apiClient.get(`/communities/${id}/messages?${params.toString()}`);
    return response.data.data;
  },

  // Send message
  sendMessage: async (id: number, content: string, messageType = 'text', replyToId?: number): Promise<CommunityMessage> => {
    const response = await apiClient.post(`/communities/${id}/messages`, {
      content,
      message_type: messageType,
      reply_to_id: replyToId
    });
    return response.data.data;
  },

  // Delete message
  deleteMessage: async (messageId: number): Promise<void> => {
    await apiClient.delete(`/communities/messages/${messageId}`);
  },

  // ============ PRESENCE ============

  // Update presence (heartbeat)
  updatePresence: async (communityId?: number, status: 'online' | 'away' | 'busy' | 'offline' = 'online'): Promise<void> => {
    await apiClient.post('/communities/presence', { community_id: communityId, status });
  },

  // Check in to community
  checkIn: async (id: number): Promise<void> => {
    await apiClient.post(`/communities/${id}/checkin`);
  },

  // Check out from community
  checkOut: async (id: number): Promise<void> => {
    await apiClient.post(`/communities/${id}/checkout`);
  },

  // Get online users in community
  getOnlineUsers: async (id: number): Promise<CommunityMember[]> => {
    const response = await apiClient.get(`/communities/${id}/online`);
    return response.data.data;
  }
};

export default communitiesApi;
