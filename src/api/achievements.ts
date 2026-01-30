import apiClient from './client';

export const achievementsApi = {
  getUserAchievements: async () => {
    const response = await apiClient.get('/achievements/user');
    return response.data;
  },

  getUserStats: async () => {
    const response = await apiClient.get('/achievements/stats');
    return response.data;
  }
};
