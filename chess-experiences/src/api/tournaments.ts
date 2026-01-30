import apiClient from './client';

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
  rating_min?: number;
  rating_max?: number;
  status: string;
  image?: string;
  rules?: string;
  organizer_name?: string;
  venue_name?: string;
  venue_city?: string;
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
  rating_min?: number;
  rating_max?: number;
  venue_id?: number;
  image?: string;
  rules?: string;
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
};
