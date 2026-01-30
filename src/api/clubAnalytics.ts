import apiClient from './client';

export interface ClubAnalytics {
  total_members: number;
  active_members: number;
  new_members_this_month: number;
  member_growth_rate: number;
  total_events: number;
  upcoming_events: number;
  total_messages: number;
  messages_this_month: number;
  average_rating?: number;
  total_reviews?: number;
  membership_by_type: {
    monthly: number;
    yearly: number;
    lifetime: number;
  };
  role_distribution: {
    owner: number;
    admin: number;
    officer: number;
    member: number;
  };
}

export interface MemberDetail {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar?: string;
  rating?: number;
  role: string;
  status: string;
  membership_type: string;
  joined_at: string;
  last_active?: string;
}

export const clubAnalyticsApi = {
  // Get club analytics
  getAnalytics: async (clubId: number) => {
    const response = await apiClient.get(`/clubs/${clubId}/analytics`);
    return response.data;
  },

  // Get detailed member list
  getMemberDetails: async (clubId: number, params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  }) => {
    const response = await apiClient.get(`/clubs/${clubId}/members/details`, { params });
    return response.data;
  },
};
