import apiClient from './client';

export type ItemType = 'master' | 'venue' | 'club' | 'tournament' | 'player';

export interface Favorite {
  id: number;
  user_id: number;
  item_type: ItemType;
  item_id: number;
  created_at: string;
  item?: any; // Enriched item details when detailed=true
}

export interface ToggleFavoriteResponse {
  isFavorite: boolean;
}

export const favoritesApi = {
  // Get all favorites, optionally filtered by type
  getFavorites: async (type?: ItemType, detailed: boolean = false) => {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (detailed) params.detailed = 'true';

    const response = await apiClient.get('/favorites', { params });
    return response.data;
  },

  // Add item to favorites
  addFavorite: async (itemType: ItemType, itemId: number) => {
    const response = await apiClient.post('/favorites', { itemType, itemId });
    return response.data;
  },

  // Remove item from favorites
  removeFavorite: async (itemType: ItemType, itemId: number) => {
    const response = await apiClient.delete(`/favorites/${itemType}/${itemId}`);
    return response.data;
  },

  // Toggle favorite status
  toggleFavorite: async (itemType: ItemType, itemId: number): Promise<ToggleFavoriteResponse> => {
    const response = await apiClient.post('/favorites/toggle', { itemType, itemId });
    return response.data.data;
  },

  // Check if item is favorited
  checkFavorite: async (itemType: ItemType, itemId: number): Promise<boolean> => {
    const response = await apiClient.get(`/favorites/${itemType}/${itemId}`);
    return response.data.data?.isFavorite || false;
  },
};

export default favoritesApi;
