import apiClient from './client';

export interface Challenge {
  id: number;
  challenger_id: number;
  challenged_id: number;
  venue_id: number | null;
  time_control: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  response_message: string | null;
  game_id: number | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  challenger_name?: string;
  challenger_rating?: number;
  challenger_avatar?: string;
  challenged_name?: string;
  challenged_rating?: number;
  challenged_avatar?: string;
  venue_name?: string;
  venue_city?: string;
}

export interface SendChallengeInput {
  challengedId?: number; // Optional for open challenges
  venueId?: number;
  timeControl: string;
  message?: string;
}

export const challengesApi = {
  // Get all open challenges (public - for challenges board)
  getOpenChallenges: async (params?: {
    city?: string;
    venueId?: number;
    timeControl?: string;
    limit?: number;
  }) => {
    const response = await apiClient.get('/challenges/open', { params });
    return response.data;
  },

  // Send a challenge to another player
  sendChallenge: async (data: SendChallengeInput) => {
    const response = await apiClient.post('/challenges', data);
    return response.data;
  },

  // Get challenges received by current user
  getReceivedChallenges: async () => {
    const response = await apiClient.get('/challenges/received');
    return response.data;
  },

  // Get challenges sent by current user
  getSentChallenges: async () => {
    const response = await apiClient.get('/challenges/sent');
    return response.data;
  },

  // Get count of pending challenges (for notification badge)
  getPendingCount: async () => {
    const response = await apiClient.get('/challenges/pending/count');
    return response.data;
  },

  // Respond to a challenge (accept or decline)
  respondToChallenge: async (challengeId: number, response: 'accepted' | 'declined', responseMessage?: string) => {
    const res = await apiClient.post(`/challenges/${challengeId}/respond`, {
      response,
      responseMessage
    });
    return res.data;
  },

  // Cancel a sent challenge
  cancelChallenge: async (challengeId: number) => {
    const response = await apiClient.post(`/challenges/${challengeId}/cancel`);
    return response.data;
  }
};
