import apiClient from './client';

export interface LeaderboardEntry {
  user_id: number;
  user_name: string;
  user_avatar?: string;
  games_created: number;
  games_joined: number;
  games_played: number;
  total_checkins: number;
}

export const checkinsApi = {
  checkin: async (venueId: number) => {
    const response = await apiClient.post('/checkins/checkin', { venueId });
    return response.data;
  },

  checkout: async (venueId: number) => {
    const response = await apiClient.post('/checkins/checkout', { venueId });
    return response.data;
  },

  getUserStatus: async () => {
    const response = await apiClient.get('/checkins/status');
    return response.data;
  },

  getVenueCheckins: async (venueId: number) => {
    const response = await apiClient.get(`/checkins/venue/${venueId}`);
    return response.data;
  },

  getVenueLeaderboard: async (venueId: number, limit: number = 10): Promise<{ data: LeaderboardEntry[] }> => {
    const response = await apiClient.get(`/checkins/venue/${venueId}/leaderboard`, {
      params: { limit }
    });
    return response.data;
  }
};
