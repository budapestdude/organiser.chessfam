import apiClient from './client';
import type { Club } from '../types';

interface ClubAnalytics {
  member_growth: Array<{
    date: string;
    count: number;
  }>;
  rating_distribution: Array<{
    range: string;
    count: number;
  }>;
  role_distribution: Array<{
    role: string;
    count: number;
  }>;
  review_stats: {
    average_rating: number;
    total_reviews: number;
    star_breakdown: Record<string, number>;
  };
  revenue_stats: {
    total_revenue: number;
    monthly_breakdown: Array<{
      month: string;
      revenue: number;
    }>;
  };
  event_stats: {
    total_events: number;
    upcoming_events: number;
    past_events: number;
  };
  messaging_activity: {
    total_messages: number;
    daily_messages: Array<{
      date: string;
      count: number;
    }>;
  };
}

export const clubsAPI = {
  // Get all clubs for current organizer
  async getMyClubs(): Promise<Club[]> {
    const response = await apiClient.get('/clubs');
    // Filter clubs where user is owner (will be done by backend ideally)
    return response.data.data || response.data;
  },

  // Get club by ID
  async getClubById(id: number): Promise<Club> {
    const response = await apiClient.get(`/clubs/${id}`);
    return response.data.data || response.data;
  },

  // Get club analytics
  async getClubAnalytics(id: number): Promise<ClubAnalytics> {
    const response = await apiClient.get(`/analytics/clubs/${id}/analytics`);
    return response.data.data || response.data;
  },

  // Get club members
  async getMembers(id: number, page: number = 1, limit: number = 50) {
    const response = await apiClient.get(`/clubs/${id}/members`, {
      params: { page, limit }
    });
    return response.data.data || response.data;
  },

  // Get club events
  async getEvents(id: number) {
    const response = await apiClient.get(`/clubs/${id}/events`);
    return response.data.data || response.data;
  },

  // Bulk member action
  async bulkMemberAction(id: number, data: {
    action: 'promote' | 'demote' | 'remove' | 'email';
    member_ids: number[];
    new_role?: 'member' | 'coach' | 'admin';
    email_subject?: string;
    email_body?: string;
  }) {
    const response = await apiClient.post(`/clubs/${id}/members/bulk-action`, data);
    return response.data.data || response.data;
  },

  // Export members
  async exportMembers(id: number, format: 'csv' | 'xlsx' = 'csv') {
    const response = await apiClient.get(`/clubs/${id}/members/export`, {
      params: { format },
      responseType: 'blob'
    });
    // Blob responses don't have the wrapper
    return response.data;
  },
};
