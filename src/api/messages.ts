import apiClient from './client';

export interface Conversation {
  id: number;
  participant_1_id: number;
  participant_2_id: number;
  last_message_at: string;
  created_at: string;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string | null;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

export interface SendMessagePayload {
  recipientId: number;
  content: string;
}

export interface StartConversationPayload {
  recipientId: number;
  message?: string;
}

export const messagesApi = {
  getConversations: () =>
    apiClient.get<{ success: boolean; data: Conversation[] }>('/messages/conversations'),

  getMessages: (conversationId: number, page: number = 1, limit: number = 50) =>
    apiClient.get<{ success: boolean; data: Message[]; pagination: { page: number; limit: number; total: number } }>(
      `/messages/conversations/${conversationId}`,
      { params: { page, limit } }
    ),

  sendMessage: (payload: SendMessagePayload) =>
    apiClient.post<{ success: boolean; data: Message; message: string }>('/messages/send', payload),

  markConversationRead: (conversationId: number) =>
    apiClient.post<{ success: boolean; message: string }>(`/messages/conversations/${conversationId}/read`),

  startConversation: (payload: StartConversationPayload) =>
    apiClient.post<{ success: boolean; data: { conversationId: number; message?: Message }; message: string }>(
      '/messages/start',
      payload
    ),

  getUnreadCount: () =>
    apiClient.get<{ success: boolean; data: { unreadCount: number } }>('/messages/unread'),
};
