import apiClient from './client';
import type { Notification } from '../types';

export const notificationsAPI = {
  // Get notifications for current organizer
  async getNotifications(unreadOnly: boolean = false): Promise<{notifications: Notification[], unreadCount: number}> {
    const response = await apiClient.get('/notifications', {
      params: { unread_only: unreadOnly }
    });

    // Transform response to match expected format
    return {
      notifications: response.data.data || [],
      unreadCount: response.data.unread_count || 0
    };
  },

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.post(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },

  // Get unread count only
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.count;
  },
};
