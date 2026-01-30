import { useState, useCallback, useEffect } from 'react';
import api from '../api/client';

export interface ChatMessage {
  id: number;
  game_id: number;
  user_id: number;
  user_name?: string;
  user_avatar?: string;
  message: string;
  created_at: string;
  edited_at?: string;
  deleted: boolean;
}

interface UseGameChatOptions {
  gameId: number | null;
  enabled?: boolean;
}

export interface UseGameChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  sendMessage: (message: string) => Promise<void>;
  editMessage: (messageId: number, newMessage: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const MESSAGES_PER_PAGE = 50;

export function useGameChat(options: UseGameChatOptions): UseGameChatReturn {
  const { gameId, enabled = true } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Fetch messages
  const fetchMessages = useCallback(async (reset = false) => {
    if (!gameId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      const response = await api.get(`/game-chat/${gameId}/messages`, {
        params: {
          limit: MESSAGES_PER_PAGE,
          offset: currentOffset,
        },
      });

      const newMessages = response.data.data.messages || [];

      if (reset) {
        setMessages(newMessages);
        setOffset(newMessages.length);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
        setOffset(prev => prev + newMessages.length);
      }

      setHasMore(newMessages.length === MESSAGES_PER_PAGE);
    } catch (err: any) {
      console.error('[GameChat] Failed to fetch messages:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [gameId, enabled, offset]);

  // Send a message
  const sendMessage = useCallback(async (message: string) => {
    if (!gameId) {
      throw new Error('No game selected');
    }

    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (message.length > 1000) {
      throw new Error('Message too long (max 1000 characters)');
    }

    try {
      const response = await api.post(`/game-chat/${gameId}/messages`, { message });
      const newMessage = response.data.data;

      // Add new message to the beginning (most recent first)
      setMessages(prev => [newMessage, ...prev]);
    } catch (err: any) {
      console.error('[GameChat] Failed to send message:', err);
      throw new Error(err.response?.data?.message || 'Failed to send message');
    }
  }, [gameId]);

  // Edit a message
  const editMessage = useCallback(async (messageId: number, newMessage: string) => {
    if (!newMessage.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (newMessage.length > 1000) {
      throw new Error('Message too long (max 1000 characters)');
    }

    try {
      const response = await api.put(`/game-chat/messages/${messageId}`, {
        message: newMessage,
      });

      const updatedMessage = response.data.data;

      // Update message in state
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? updatedMessage : msg))
      );
    } catch (err: any) {
      console.error('[GameChat] Failed to edit message:', err);
      throw new Error(err.response?.data?.message || 'Failed to edit message');
    }
  }, []);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      await api.delete(`/game-chat/messages/${messageId}`);

      // Mark message as deleted in state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, deleted: true, message: '[deleted]' } : msg
        )
      );
    } catch (err: any) {
      console.error('[GameChat] Failed to delete message:', err);
      throw new Error(err.response?.data?.message || 'Failed to delete message');
    }
  }, []);

  // Load more messages (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchMessages(false);
  }, [hasMore, isLoading, fetchMessages]);

  // Refresh messages (reload from start)
  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchMessages(true);
  }, [fetchMessages]);

  // Initial load
  useEffect(() => {
    if (gameId && enabled) {
      setMessages([]);
      setOffset(0);
      setHasMore(false);
      fetchMessages(true);
    }
  }, [gameId, enabled]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    refresh,
  };
}
