import apiClient from './client';
import type { Game, GameWithDetails, CreateGameData, GameFilters } from '../types/game';

export const gamesApi = {
  // Get all games with optional filters
  getGames: async (filters?: GameFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`/games?${params.toString()}`);
    return response.data;
  },

  // Get a single game by ID
  getGameById: async (id: number) => {
    const response = await apiClient.get<{ success: boolean; data: GameWithDetails }>(
      `/games/${id}`
    );
    return response.data;
  },

  // Create a new game
  createGame: async (data: CreateGameData) => {
    const response = await apiClient.post<{ success: boolean; data: Game; message: string }>(
      '/games',
      data
    );
    return response.data;
  },

  // Join a game
  joinGame: async (gameId: number) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/games/${gameId}/join`
    );
    return response.data;
  },

  // Leave a game
  leaveGame: async (gameId: number) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/games/${gameId}/leave`
    );
    return response.data;
  },

  // Cancel a game (creator only)
  cancelGame: async (gameId: number) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/games/${gameId}/cancel`
    );
    return response.data;
  },

  // Get games created by current user
  getMyGames: async () => {
    const response = await apiClient.get<{ success: boolean; data: Game[] }>(
      '/games/user/created'
    );
    return response.data;
  },

  // Get games joined by current user
  getJoinedGames: async () => {
    const response = await apiClient.get<{ success: boolean; data: GameWithDetails[] }>(
      '/games/user/joined'
    );
    return response.data;
  },
};
