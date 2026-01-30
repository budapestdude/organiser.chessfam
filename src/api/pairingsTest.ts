import apiClient from './client';
import type { StandingsEntry } from './pairings';

export interface TestTournamentConfig {
  playerCount?: number;
  rounds?: number;
  pairingSystem?: 'dutch' | 'burstein';
  tournamentName?: string;
}

export interface TestParticipant {
  id: number;
  player_name: string;
  player_rating: number;
}

export interface CreateTestTournamentResponse {
  tournamentId: number;
  participants: TestParticipant[];
  rounds: number;
  pairingSystem: string;
}

export interface GameResult {
  gameId: number;
  whitePlayerId?: number;
  blackPlayerId?: number;
  result: 'white_win' | 'black_win' | 'draw';
}

export interface RoundResult {
  round: number;
  pairings: any[];
  results: GameResult[];
}

export interface AutomatedTournamentResult {
  tournamentId: number;
  totalRounds: number;
  roundResults: RoundResult[];
  standings: StandingsEntry[];
}

export interface SingleRoundResult {
  round: number;
  pairings: any[];
  results: GameResult[];
  standings: StandingsEntry[];
}

export interface TournamentParticipant extends StandingsEntry {
  status: 'confirmed' | 'withdrawn' | 'pending';
}

export interface WithdrawPlayerResponse {
  playerId: number;
  playerName: string;
}

export const pairingsTestAPI = {
  // Create test tournament with mock participants
  async createTestTournament(config: TestTournamentConfig = {}): Promise<CreateTestTournamentResponse> {
    const response = await apiClient.post('/pairings-test/create', config);
    return response.data.data || response.data;
  },

  // Run entire tournament automatically (all rounds with random results)
  async runAutomatedTournament(tournamentId: number): Promise<AutomatedTournamentResult> {
    const response = await apiClient.post(`/pairings-test/${tournamentId}/run-all`);
    return response.data.data || response.data;
  },

  // Run single round with random results
  async runSingleTestRound(tournamentId: number): Promise<SingleRoundResult> {
    const response = await apiClient.post(`/pairings-test/${tournamentId}/run-round`);
    return response.data.data || response.data;
  },

  // Get tournament participants with status
  async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
    const response = await apiClient.get(`/pairings-test/${tournamentId}/participants`);
    return response.data.data || response.data;
  },

  // Withdraw a player
  async withdrawPlayer(tournamentId: number, playerId: number): Promise<WithdrawPlayerResponse> {
    const response = await apiClient.post(`/pairings-test/${tournamentId}/players/${playerId}/withdraw`);
    return response.data.data || response.data;
  },

  // Request voluntary bye for a specific round
  async requestVoluntaryBye(tournamentId: number, playerId: number, roundNumber: number): Promise<any> {
    const response = await apiClient.post(`/pairings-test/${tournamentId}/players/${playerId}/bye`, {
      roundNumber
    });
    return response.data.data || response.data;
  },

  // Simulate random withdrawals
  async simulateRandomWithdrawals(tournamentId: number, withdrawalCount: number): Promise<WithdrawPlayerResponse[]> {
    const response = await apiClient.post(`/pairings-test/${tournamentId}/simulate-withdrawals`, {
      withdrawalCount
    });
    return response.data.data || response.data;
  },

  // Delete test tournament
  async deleteTestTournament(tournamentId: number): Promise<void> {
    await apiClient.delete(`/pairings-test/${tournamentId}`);
  },
};
