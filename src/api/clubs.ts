import apiClient from './client';

export interface Club {
  id: number;
  owner_id?: number;
  venue_id?: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  founded_year?: number;
  member_count: number;
  image?: string;
  images?: string[]; // Gallery images
  meeting_schedule?: string;
  membership_fee: number;
  is_active: boolean;
  website?: string;
  contact_email?: string;
  owner_name?: string;
  venue_name?: string;
  venue_address?: string;
  premium_discount_eligible?: boolean;
}

export interface CreateClubInput {
  name: string;
  description?: string;
  // Location fields
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  founded_year?: number;
  image?: string;
  images?: string[]; // Gallery images
  meeting_schedule?: string;
  membership_fee?: number;
  venue_id?: number;
  website?: string;
  contact_email?: string;
}

export interface ClubMember {
  id: number;
  user_id: number;
  name: string;
  rating: number;
  avatar?: string;
  role: string;
  joined_at: string;
  status: string;
}

export const clubsApi = {
  // Get all clubs with optional filters
  getClubs: async (params?: {
    city?: string;
    country?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/clubs', { params });
    return response.data;
  },

  // Get club by ID
  getClubById: async (id: number) => {
    const response = await apiClient.get(`/clubs/${id}`);
    return response.data;
  },

  // Create a club
  createClub: async (data: CreateClubInput) => {
    const response = await apiClient.post('/clubs', data);
    return response.data;
  },

  // Update a club
  updateClub: async (id: number, data: Partial<CreateClubInput>) => {
    const response = await apiClient.put(`/clubs/${id}`, data);
    return response.data;
  },

  // Join a club
  joinClub: async (clubId: number) => {
    const response = await apiClient.post(`/clubs/${clubId}/join`);
    return response.data;
  },

  // Leave a club
  leaveClub: async (clubId: number) => {
    const response = await apiClient.delete(`/clubs/${clubId}/leave`);
    return response.data;
  },

  // Check if user is a member
  checkMembership: async (clubId: number) => {
    const response = await apiClient.get(`/clubs/${clubId}/membership`);
    return response.data;
  },

  // Get club members
  getMembers: async (clubId: number, page: number = 1, limit: number = 50) => {
    const response = await apiClient.get(`/clubs/${clubId}/members`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Update member role (admin only)
  updateMemberRole: async (clubId: number, userId: number, role: 'member' | 'officer' | 'admin') => {
    const response = await apiClient.put(`/clubs/${clubId}/members/${userId}/role`, { role });
    return response.data;
  },

  // Get user's club memberships
  getMyMemberships: async () => {
    const response = await apiClient.get('/clubs/user/memberships');
    return response.data;
  },

  // Ban member (admin/owner only)
  banMember: async (clubId: number, userId: number, reason?: string) => {
    const response = await apiClient.post(`/clubs/${clubId}/members/${userId}/ban`, { reason });
    return response.data;
  },

  // Unban member (admin/owner only)
  unbanMember: async (clubId: number, userId: number) => {
    const response = await apiClient.post(`/clubs/${clubId}/members/${userId}/unban`);
    return response.data;
  },

  // Transfer ownership (owner only)
  transferOwnership: async (clubId: number, newOwnerId: number) => {
    const response = await apiClient.post(`/clubs/${clubId}/transfer-ownership`, { new_owner_id: newOwnerId });
    return response.data;
  },
};
