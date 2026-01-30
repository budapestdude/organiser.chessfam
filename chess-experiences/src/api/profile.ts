import apiClient from './client';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  rating: number;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  fide_id: string | null;
  lichess_username: string | null;
  chesscom_username: string | null;
  chess_title: string | null;
  peak_rating: number | null;
  preferred_time_control: string | null;
  looking_for_games: boolean;
  looking_for_students: boolean;
  looking_for_coach: boolean;
  profile_visibility: string;
  show_rating: boolean;
  show_email: boolean;
  is_master: boolean;
  created_at: string;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  location?: string;
  country?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  fide_id?: string;
  lichess_username?: string;
  chesscom_username?: string;
  chess_title?: string;
  rating?: number;
  peak_rating?: number;
  preferred_time_control?: string;
  looking_for_games?: boolean;
  looking_for_students?: boolean;
  looking_for_coach?: boolean;
  profile_visibility?: string;
  show_rating?: boolean;
  show_email?: boolean;
}

export interface PlayerSearchResult {
  id: number;
  name: string;
  avatar: string | null;
  rating?: number;
  location: string | null;
  country: string | null;
  chess_title: string | null;
  bio: string | null;
  looking_for_games: boolean;
  looking_for_students: boolean;
  looking_for_coach: boolean;
  preferred_time_control: string | null;
  is_master: boolean;
}

export const profileApi = {
  // Get my full profile
  getMyProfile: async () => {
    const response = await apiClient.get('/profile/me');
    return response.data;
  },

  // Update my profile
  updateMyProfile: async (data: UpdateProfileInput) => {
    const response = await apiClient.put('/profile/me', data);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/profile/me/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Change email
  changeEmail: async (newEmail: string, password: string) => {
    const response = await apiClient.post('/profile/me/change-email', {
      newEmail,
      password,
    });
    return response.data;
  },

  // Get public profile
  getPublicProfile: async (userId: number) => {
    const response = await apiClient.get(`/profile/${userId}`);
    return response.data;
  },

  // Search players
  searchPlayers: async (params?: {
    q?: string;
    location?: string;
    country?: string;
    min_rating?: number;
    max_rating?: number;
    looking_for_games?: boolean;
    chess_title?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/profile/search', { params });
    return response.data;
  },
};
