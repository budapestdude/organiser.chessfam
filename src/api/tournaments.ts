import apiClient from './client';
import type { Tournament, TournamentAnalytics } from '../types';

export const tournamentsAPI = {
  // Get all tournaments for current organizer
  async getMyTournaments(): Promise<Tournament[]> {
    const response = await apiClient.get('/tournaments/user/my-tournaments');
    return response.data;
  },

  // Get tournament by ID
  async getTournamentById(id: number): Promise<Tournament> {
    const response = await apiClient.get(`/tournaments/${id}`);
    return response.data;
  },

  // Get tournament analytics
  async getTournamentAnalytics(id: number): Promise<TournamentAnalytics> {
    const response = await apiClient.get(`/tournaments/${id}/analytics`);
    return response.data;
  },

  // Get tournament participants
  async getParticipants(id: number, page: number = 1, limit: number = 50) {
    const response = await apiClient.get(`/tournaments/${id}/participants`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Bulk participant action
  async bulkParticipantAction(id: number, data: {
    action: 'approve' | 'reject' | 'refund' | 'email';
    participant_ids: number[];
    email_subject?: string;
    email_body?: string;
  }) {
    const response = await apiClient.post(`/tournaments/${id}/participants/bulk-action`, data);
    return response.data;
  },

  // Export participants
  async exportParticipants(id: number, format: 'csv' | 'xlsx' = 'csv') {
    const response = await apiClient.get(`/tournaments/${id}/participants/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },
};
