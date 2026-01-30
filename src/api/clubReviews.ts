import apiClient from './client';

export interface SubmitClubReviewRequest {
  clubId: number;
  rating: number;
  reviewText?: string;
}

export interface ClubReview {
  id: number;
  reviewer_id: number;
  club_id: number;
  rating: number;
  review_text?: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface ClubReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingCounts: Record<number, number>;
}

export const clubReviewsApi = {
  submitReview: async (data: SubmitClubReviewRequest) => {
    const response = await apiClient.post('/club-reviews/submit', data);
    return response.data;
  },

  getClubReviews: async (clubId: number): Promise<{ reviews: ClubReview[]; stats: ClubReviewStats }> => {
    const response = await apiClient.get(`/club-reviews/${clubId}`);
    return response.data.data;
  },

  getUserReview: async (clubId: number): Promise<ClubReview | null> => {
    const response = await apiClient.get(`/club-reviews/user/${clubId}`);
    return response.data.data;
  }
};
