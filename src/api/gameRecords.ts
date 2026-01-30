import apiClient from './client';

export const gameRecordsApi = {
  // Game record operations
  submitGameResult: async (gameId: number, data: {
    result: 'white_win' | 'black_win' | 'draw';
    winner_id?: number;
    pgn_data?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post(`/records/games/${gameId}/result`, data);
    return response.data;
  },

  uploadGamePGN: async (gameId: number, data: {
    pgn_content: string;
    white_player?: string;
    black_player?: string;
    result?: string;
    date_played?: string;
    event_name?: string;
  }) => {
    const response = await apiClient.post(`/records/games/${gameId}/pgn`, data);
    return response.data;
  },

  toggleGamePrivacy: async (gameId: number, isPublic: boolean) => {
    const response = await apiClient.patch(`/records/games/${gameId}/privacy`, { is_public: isPublic });
    return response.data;
  },

  getGameRecord: async (gameId: number) => {
    const response = await apiClient.get(`/records/games/${gameId}/record`);
    return response.data;
  },

  // Tournament record operations
  submitTournamentResults: async (tournamentId: number, data: {
    standings: Array<{
      user_id?: number;
      player_name: string;
      rank: number;
      score: number;
      wins?: number;
      losses?: number;
      draws?: number;
      games_played?: number;
      prize_won?: number;
    }>;
    final_standings_text?: string;
  }) => {
    const response = await apiClient.post(`/records/tournaments/${tournamentId}/results`, data);
    return response.data;
  },

  toggleTournamentPrivacy: async (tournamentId: number, isPublic: boolean) => {
    const response = await apiClient.patch(`/records/tournaments/${tournamentId}/privacy`, { is_public: isPublic });
    return response.data;
  },

  getTournamentRecord: async (tournamentId: number) => {
    const response = await apiClient.get(`/records/tournaments/${tournamentId}/record`);
    return response.data;
  }
};
