import apiClient from './client';

export const checkinsApi = {
  checkin: async (venueId: number) => {
    const response = await apiClient.post('/checkins/checkin', { venueId });
    return response.data;
  },

  checkout: async (venueId: number) => {
    const response = await apiClient.post('/checkins/checkout', { venueId });
    return response.data;
  },

  getUserStatus: async () => {
    const response = await apiClient.get('/checkins/status');
    return response.data;
  },

  getVenueCheckins: async (venueId: number) => {
    const response = await apiClient.get(`/checkins/venue/${venueId}`);
    return response.data;
  }
};
