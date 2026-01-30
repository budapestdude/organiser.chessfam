import apiClient from './client';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: number;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: number;
  user_id: number;
  tournament_join_enabled: boolean;
  club_join_enabled: boolean;
  game_invite_enabled: boolean;
  system_messages_enabled: boolean;
  email_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationsApi = {
  // Get notifications
  getNotifications: async (params?: { limit?: number; offset?: number; unread_only?: boolean }) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: number) => {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: number) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Get notification preferences
  getPreferences: async () => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data;
  },

  // Send system notification (admin only)
  sendSystemNotification: async (data: { title: string; message: string; user_ids?: number[] }) => {
    const response = await apiClient.post('/notifications/system', data);
    return response.data;
  }
};
