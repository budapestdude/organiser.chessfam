import apiClient from './client';

export interface SubmitTournamentReviewRequest {
  tournamentId: number;
  rating: number;
  reviewText?: string;
}

export interface TournamentReview {
  id: number;
  reviewer_id: number;
  tournament_id: number;
  rating: number;
  review_text?: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingCounts: Record<number, number>;
}

export const tournamentReviewsApi = {
  submitReview: async (data: SubmitTournamentReviewRequest) => {
    const response = await apiClient.post('/tournament-reviews/submit', data);
    return response.data;
  },

  getTournamentReviews: async (tournamentId: number): Promise<{ reviews: TournamentReview[]; stats: TournamentReviewStats }> => {
    const response = await apiClient.get(`/tournament-reviews/${tournamentId}`);
    return response.data.data;
  },

  getUserReview: async (tournamentId: number): Promise<TournamentReview | null> => {
    const response = await apiClient.get(`/tournament-reviews/user/${tournamentId}`);
    return response.data.data;
  }
};
