import apiClient from './client';

export interface SubmitVenueReviewRequest {
  venueId: number;
  rating: number;
  reviewText?: string;
}

export const venueReviewsApi = {
  submitReview: async (data: SubmitVenueReviewRequest) => {
    const response = await apiClient.post('/venue-reviews/submit', data);
    return response.data;
  },

  getVenueReviews: async (venueId: number) => {
    const response = await apiClient.get(`/venue-reviews/${venueId}`);
    return response.data;
  },

  getUserReview: async (venueId: number) => {
    const response = await apiClient.get(`/venue-reviews/user/${venueId}`);
    return response.data;
  }
};
