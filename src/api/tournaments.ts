import apiClient from './client';

export interface EarlyBirdTier {
  deadline: string; // ISO date string
  discount: number; // Discount amount (percentage or fixed)
  discount_type: 'percentage' | 'fixed'; // Type of discount
  label: string; // Display label (e.g., "Super Early Bird", "Early Bird")
}

export interface Tournament {
  id: number;
  organizer_id?: number;
  venue_id?: number;
  name: string;
  description?: string;
  tournament_type?: string;
  time_control?: string;
  format?: string;
  start_date: string;
  end_date?: string;
  registration_deadline?: string;
  max_participants?: number;
  current_participants: number;
  entry_fee: number;
  prize_pool?: number;
  currency?: string; // ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP')
  rating_min?: number;
  rating_max?: number;
  status: string;
  image?: string;
  images?: string[]; // Gallery images
  rules?: string;
  external_registration_url?: string; // External registration URL (overrides internal flow)
  organizer_name?: string;
  venue_name?: string;
  venue_city?: string;
  // Tournament category fields
  tournament_category?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_count?: number;
  parent_tournament_id?: number;
  is_festival?: boolean;
  festival_id?: number;
  is_series_parent?: boolean;
  premium_discount_eligible?: boolean;
  early_bird_pricing?: EarlyBirdTier[]; // Array of up to 3 early bird pricing tiers
  // Variable pricing discounts
  junior_discount?: number; // Percentage discount for juniors (e.g., 20 for 20%)
  senior_discount?: number; // Percentage discount for seniors (e.g., 15 for 15%)
  women_discount?: number; // Percentage discount for women (e.g., 25 for 25%)
  junior_age_max?: number; // Max age for junior discount (default: 18)
  senior_age_min?: number; // Min age for senior discount (default: 65)
  // Titled player discounts
  gm_wgm_discount?: number; // Percentage discount for GM/WGM players (e.g., 30 for 30%)
  im_wim_discount?: number; // Percentage discount for IM/WIM players (e.g., 25 for 25%)
  fm_wfm_discount?: number; // Percentage discount for FM/WFM players (e.g., 20 for 20%)
}

export interface CreateTournamentInput {
  name: string;
  description?: string;
  tournament_type?: string;
  time_control?: string;
  format?: string;
  start_date: string;
  end_date?: string;
  registration_deadline?: string;
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
  currency?: string;
  rating_min?: number;
  rating_max?: number;
  venue_id?: number;
  image?: string;
  images?: string[]; // Gallery images
  rules?: string;
  external_registration_url?: string; // External registration URL (overrides internal flow)
  // Location fields for OTB/hybrid tournaments
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  // Tournament category fields
  tournament_category?: string; // 'one-off', 'recurring', 'festival'
  is_recurring?: boolean;
  recurrence_pattern?: string; // 'weekly', 'biweekly', 'monthly'
  recurrence_count?: number;
  is_festival?: boolean;
  early_bird_pricing?: EarlyBirdTier[]; // Array of up to 3 early bird pricing tiers
  // Variable pricing discounts
  junior_discount?: number;
  senior_discount?: number;
  women_discount?: number;
  junior_age_max?: number;
  senior_age_min?: number;
  gm_wgm_discount?: number;
  im_wim_discount?: number;
  fm_wfm_discount?: number;
}

export interface TournamentRegistration {
  id: number;
  tournament_id: number;
  user_id: number;
  registration_date: string;
  payment_status: string;
  status: string;
}

export interface TournamentParticipant {
  id: number;
  user_id: number;
  name: string;
  rating: number;
  avatar?: string;
  registration_date: string;
  status: string;
}

export const tournamentsApi = {
  // Get all tournaments with optional filters
  getTournaments: async (params?: {
    status?: string;
    format?: string;
    city?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/tournaments', { params });
    return response.data;
  },

  // Get tournament by ID
  getTournamentById: async (id: number) => {
    const response = await apiClient.get(`/tournaments/${id}`);
    return response.data;
  },

  // Create a tournament
  createTournament: async (data: CreateTournamentInput) => {
    const response = await apiClient.post('/tournaments', data);
    return response.data;
  },

  // Update a tournament
  updateTournament: async (id: number, data: Partial<CreateTournamentInput>) => {
    const response = await apiClient.put(`/tournaments/${id}`, data);
    return response.data;
  },

  // Register for a tournament
  registerForTournament: async (tournamentId: number) => {
    const response = await apiClient.post(`/tournaments/${tournamentId}/register`);
    return response.data;
  },

  // Withdraw from a tournament
  withdrawFromTournament: async (tournamentId: number) => {
    const response = await apiClient.delete(`/tournaments/${tournamentId}/register`);
    return response.data;
  },

  // Check if user is registered for a tournament
  checkRegistration: async (tournamentId: number) => {
    const response = await apiClient.get(`/tournaments/${tournamentId}/registration`);
    return response.data;
  },

  // Get tournament participants
  getParticipants: async (tournamentId: number, page: number = 1, limit: number = 50) => {
    const response = await apiClient.get(`/tournaments/${tournamentId}/participants`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get user's tournament registrations
  getMyRegistrations: async () => {
    const response = await apiClient.get('/tournaments/user/registrations');
    return response.data;
  },

  // Get tournaments I've organized
  getMyTournaments: async () => {
    const response = await apiClient.get('/tournaments/user/my-tournaments');
    return response.data;
  },

  // Delete a tournament
  deleteTournament: async (id: number) => {
    const response = await apiClient.delete(`/tournaments/${id}`);
    return response.data;
  },

  // Get tournament series data (all editions)
  getTournamentSeries: async (id: number) => {
    const response = await apiClient.get(`/tournaments/${id}/series`);
    return response.data;
  },

  // Get all images from series
  getTournamentSeriesImages: async (id: number) => {
    const response = await apiClient.get(`/tournaments/${id}/series/images`);
    return response.data;
  },

  // Get all reviews from series
  getTournamentSeriesReviews: async (id: number, page: number = 1) => {
    const response = await apiClient.get(`/tournaments/${id}/series/reviews`, {
      params: { page, limit: 20 }
    });
    return response.data;
  },

  // Create a tournament series (parent + first edition)
  createTournamentSeries: async (seriesData: any, firstEditionData: any) => {
    const response = await apiClient.post('/tournaments/series/create', {
      seriesData,
      firstEditionData
    });
    return response.data;
  },

  // Get all tournament series (for admin)
  getAllTournamentSeries: async () => {
    const response = await apiClient.get('/tournaments/series/all');
    return response.data;
  },

  // Update tournament series
  updateTournamentSeries: async (id: number, data: { name?: string; description?: string; image?: string; images?: string[]; organizer_name_override?: string }) => {
    const response = await apiClient.put(`/tournaments/${id}/series`, data);
    return response.data;
  },

  // Get festival events
  getFestivalEvents: async (festivalId: number) => {
    const response = await apiClient.get(`/tournaments/${festivalId}/events`);
    return response.data;
  },
};
