import apiClient from './client';

export interface Pairing {
  id: number;
  tournament_id: number;
  round_number: number;
  board_number: number;
  white_player_id: number;
  black_player_id: number;
  white_player_name: string;
  white_player_rating: number;
  white_pairing_number: number;
  black_player_name: string;
  black_player_rating: number;
  black_pairing_number: number;
  result: 'white_win' | 'black_win' | 'draw' | 'ongoing' | 'forfeit_white' | 'forfeit_black';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  pgn?: string;
}

export interface RoundSummary {
  round_number: number;
  total_games: number;
  ongoing_games: number;
  completed_games: number;
}

export interface StandingsEntry {
  id: number;
  player_name: string;
  player_rating: number;
  pairing_number: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  score: number;
}

export const pairingsAPI = {
  // Generate pairings for next round
  async generateNextRound(tournamentId: number, system: 'dutch' | 'burstein' = 'dutch') {
    const response = await apiClient.post(
      `/pairings/${tournamentId}/rounds/generate`,
      { system }
    );
    return response.data.data || response.data;
  },

  // Get all rounds summary
  async getAllRounds(tournamentId: number): Promise<RoundSummary[]> {
    const response = await apiClient.get(`/pairings/${tournamentId}/rounds`);
    return response.data.data || response.data;
  },

  // Get pairings for a specific round
  async getRoundPairings(tournamentId: number, roundNumber: number): Promise<Pairing[]> {
    const response = await apiClient.get(
      `/pairings/${tournamentId}/rounds/${roundNumber}`
    );
    return response.data.data || response.data;
  },

  // Submit game result
  async submitResult(
    tournamentId: number,
    gameId: number,
    result: 'white_win' | 'black_win' | 'draw' | 'forfeit_white' | 'forfeit_black',
    pgn?: string
  ) {
    const response = await apiClient.post(
      `/pairings/${tournamentId}/games/${gameId}/result`,
      { result, pgn }
    );
    return response.data.data || response.data;
  },

  // Get standings
  async getStandings(tournamentId: number): Promise<StandingsEntry[]> {
    const response = await apiClient.get(`/pairings/${tournamentId}/standings`);
    return response.data.data || response.data;
  },

  // Delete a round
  async deleteRound(tournamentId: number, roundNumber: number) {
    const response = await apiClient.delete(
      `/pairings/${tournamentId}/rounds/${roundNumber}`
    );
    return response.data.data || response.data;
  },
};
