import apiClient from './client';

export interface SubmitPlayerReviewRequest {
  playerId: number;
  rating: number;
  badges: string[];
}

export const playerReviewsApi = {
  submitReview: async (data: SubmitPlayerReviewRequest) => {
    const response = await apiClient.post('/player-reviews/submit', data);
    return response.data;
  },

  getPlayerReviews: async (playerId: number) => {
    const response = await apiClient.get(`/player-reviews/${playerId}`);
    return response.data;
  },

  getUserReview: async (playerId: number) => {
    const response = await apiClient.get(`/player-reviews/user/${playerId}`);
    return response.data;
  }
};
