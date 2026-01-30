import api from './client';

// Get active theater content for a community
export const getTheaterContent = (communityId: number) =>
  api.get(`/communities/${communityId}/theater`);

// Get all theater content for a community (admin only)
export const getAllTheaterContent = (communityId: number) =>
  api.get(`/communities/${communityId}/theater/all`);

// Create or update theater content (admin only)
export const upsertTheaterContent = (communityId: number, data: {
  type: string;
  title: string;
  subtitle?: string;
  thumbnail_url?: string;
  stream_url?: string;
  white_player?: string;
  black_player?: string;
  white_rating?: number;
  black_rating?: number;
  game_url?: string;
  is_live?: boolean;
  viewer_count?: number;
  starts_at?: string;
  ends_at?: string;
  priority?: number;
}) =>
  api.post(`/communities/${communityId}/theater`, data);

// Delete theater content (admin only)
export const deleteTheaterContent = (communityId: number, contentId: number) =>
  api.delete(`/communities/${communityId}/theater/${contentId}`);
