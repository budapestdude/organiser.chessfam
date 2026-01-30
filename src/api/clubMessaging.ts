import apiClient from './client';

export interface ClubMessage {
  id: number;
  club_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  message_type: 'general' | 'announcement' | 'event';
  message_text: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
}

export interface SendMessageInput {
  message_text: string;
  message_type?: 'general' | 'announcement' | 'event';
}

export const clubMessagingApi = {
  // Send message
  sendMessage: async (clubId: number, data: SendMessageInput) => {
    const response = await apiClient.post(`/clubs/${clubId}/messages`, data);
    return response.data;
  },

  // Get messages
  getMessages: async (clubId: number, params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get(`/clubs/${clubId}/messages`, { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (clubId: number) => {
    const response = await apiClient.get(`/clubs/${clubId}/messages/unread-count`);
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId: number) => {
    const response = await apiClient.post(`/messages/${messageId}/read`);
    return response.data;
  },

  // Pin/unpin message
  togglePin: async (messageId: number, isPinned: boolean) => {
    const response = await apiClient.patch(`/messages/${messageId}/pin`, { is_pinned: isPinned });
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId: number) => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};
