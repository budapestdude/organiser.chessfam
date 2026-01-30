import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../api/auth';
import { messagesApi } from '../api/messages';
import { TokenManager } from '../utils/token';

export interface User {
  id: number;
  name: string;
  email: string;
  rating?: number;
  avatar?: string;
  created_at?: Date;
  is_admin?: boolean;
}

export interface Booking {
  id: string;
  type: 'master' | 'tournament' | 'club' | 'game';
  itemId: number;
  itemName: string;
  date: string;
  time?: string;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: number;
  participantName: string;
  participantImage: string;
  participantType: 'master' | 'player';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// API-based message types for backend integration
export interface ApiMessageData {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface ApiConversationData {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Favorite {
  id: string;
  type: 'master' | 'tournament' | 'club' | 'player' | 'location';
  itemId: number;
  itemName: string;
  itemImage: string;
  addedAt: string;
}

interface AppState {
  user: User | null;
  authInitialized: boolean;
  bookings: Booking[];
  conversations: Conversation[];
  messages: Message[];
  favorites: Favorite[];
  isAuthModalOpen: boolean;
  authMode: 'login' | 'signup';
  isLoading: boolean;
  error: string | null;

  // Auth actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  openAuthModal: (mode: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;

  // Booking actions
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  cancelBooking: (id: string) => void;
  getBookingsByType: (type: Booking['type']) => Booking[];

  // Message actions (local - for backwards compatibility)
  startConversation: (participant: Omit<Conversation, 'id' | 'unreadCount' | 'lastMessage' | 'lastMessageTime'>) => string;
  sendMessage: (conversationId: string, content: string) => void;
  markConversationRead: (conversationId: string) => void;
  getConversationMessages: (conversationId: string) => Message[];

  // Message actions (API-based)
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<ApiMessageData[]>;
  sendMessageToApi: (recipientId: number, content: string) => Promise<void>;
  startConversationApi: (recipientId: number, initialMessage?: string) => Promise<number>;
  markConversationReadApi: (conversationId: number) => Promise<void>;
  getUnreadCount: () => Promise<number>;

  // API conversation state
  apiConversations: ApiConversationData[];
  apiMessages: Record<number, ApiMessageData[]>;
  messagesLoading: boolean;
  messagesError: string | null;

  // Favorite actions
  addFavorite: (favorite: Omit<Favorite, 'id' | 'addedAt'>) => void;
  removeFavorite: (itemId: number, type: Favorite['type']) => void;
  isFavorite: (itemId: number, type: Favorite['type']) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      authInitialized: false,
      bookings: [],
      conversations: [],
      messages: [],
      favorites: [],
      isAuthModalOpen: false,
      authMode: 'login',
      isLoading: false,
      error: null,

      // API-based message state
      apiConversations: [],
      apiMessages: {},
      messagesLoading: false,
      messagesError: null,

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token, refreshToken } = await authAPI.login({ email, password });
          TokenManager.setTokens(token, refreshToken);
          set({ user, isLoading: false, isAuthModalOpen: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      signup: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token, refreshToken } = await authAPI.signup({ name, email, password });
          TokenManager.setTokens(token, refreshToken);
          set({ user, isLoading: false, isAuthModalOpen: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Signup failed',
            isLoading: false
          });
          throw error;
        }
      },

      initializeAuth: async () => {
        const token = TokenManager.getToken();
        if (token && !TokenManager.isTokenExpired(token)) {
          try {
            const { user } = await authAPI.me();
            set({ user, authInitialized: true });
          } catch (error) {
            TokenManager.clearTokens();
            set({ user: null, authInitialized: true });
          }
        } else {
          TokenManager.clearTokens();
          set({ user: null, authInitialized: true });
        }
      },

      openAuthModal: (mode) => set({ isAuthModalOpen: true, authMode: mode, error: null }),

      closeAuthModal: () => set({ isAuthModalOpen: false, error: null }),

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          TokenManager.clearTokens();
          set({ user: null, bookings: [], conversations: [], messages: [], favorites: [] });
        }
      },

      addBooking: (booking) => {
        const newBooking: Booking = {
          ...booking,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ bookings: [...state.bookings, newBooking] }));
      },

      cancelBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'cancelled' } : b
          ),
        }));
      },

      getBookingsByType: (type) => {
        return get().bookings.filter((b) => b.type === type);
      },

      // Message actions
      startConversation: (participant) => {
        const existing = get().conversations.find(
          (c) => c.participantId === participant.participantId && c.participantType === participant.participantType
        );
        if (existing) return existing.id;

        const id = Math.random().toString(36).substr(2, 9);
        const newConversation: Conversation = {
          ...participant,
          id,
          unreadCount: 0,
        };
        set((state) => ({ conversations: [...state.conversations, newConversation] }));
        return id;
      },

      sendMessage: (conversationId, content) => {
        const { user } = get();
        if (!user) return;

        const newMessage: Message = {
          id: Math.random().toString(36).substr(2, 9),
          conversationId,
          senderId: String(user.id),
          senderName: user.name,
          senderImage: user.avatar,
          content,
          timestamp: new Date().toISOString(),
          read: true,
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: content, lastMessageTime: newMessage.timestamp }
              : c
          ),
        }));
      },

      markConversationRead: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ),
          messages: state.messages.map((m) =>
            m.conversationId === conversationId ? { ...m, read: true } : m
          ),
        }));
      },

      getConversationMessages: (conversationId) => {
        return get().messages.filter((m) => m.conversationId === conversationId);
      },

      // API-based message actions
      fetchConversations: async () => {
        set({ messagesLoading: true, messagesError: null });
        try {
          const response = await messagesApi.getConversations();
          const conversations = response.data.data.map((conv): ApiConversationData => ({
            id: conv.id,
            otherUserId: conv.other_user_id,
            otherUserName: conv.other_user_name,
            otherUserAvatar: conv.other_user_avatar,
            lastMessage: conv.last_message,
            lastMessageAt: conv.last_message_at,
            unreadCount: conv.unread_count,
          }));
          set({ apiConversations: conversations, messagesLoading: false });
        } catch (error: any) {
          set({
            messagesError: error.response?.data?.error || 'Failed to fetch conversations',
            messagesLoading: false,
          });
        }
      },

      fetchMessages: async (conversationId: number) => {
        set({ messagesLoading: true, messagesError: null });
        try {
          const response = await messagesApi.getMessages(conversationId);
          const messages = response.data.data.map((msg): ApiMessageData => ({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            senderAvatar: msg.sender_avatar,
            content: msg.content,
            createdAt: msg.created_at,
            readAt: msg.read_at,
          }));
          set((state) => ({
            apiMessages: { ...state.apiMessages, [conversationId]: messages },
            messagesLoading: false,
          }));
          return messages;
        } catch (error: any) {
          set({
            messagesError: error.response?.data?.error || 'Failed to fetch messages',
            messagesLoading: false,
          });
          return [];
        }
      },

      sendMessageToApi: async (recipientId: number, content: string) => {
        try {
          await messagesApi.sendMessage({ recipientId, content });
          // Refresh conversations to update last message
          get().fetchConversations();
        } catch (error: any) {
          set({
            messagesError: error.response?.data?.error || 'Failed to send message',
          });
          throw error;
        }
      },

      startConversationApi: async (recipientId: number, initialMessage?: string) => {
        try {
          const response = await messagesApi.startConversation({ recipientId, message: initialMessage });
          // Refresh conversations
          get().fetchConversations();
          return response.data.data.conversationId;
        } catch (error: any) {
          set({
            messagesError: error.response?.data?.error || 'Failed to start conversation',
          });
          throw error;
        }
      },

      markConversationReadApi: async (conversationId: number) => {
        try {
          await messagesApi.markConversationRead(conversationId);
          // Update local state
          set((state) => ({
            apiConversations: state.apiConversations.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c
            ),
          }));
        } catch (error: any) {
          console.error('Failed to mark conversation as read:', error);
        }
      },

      getUnreadCount: async () => {
        try {
          const response = await messagesApi.getUnreadCount();
          return response.data.data.unreadCount;
        } catch (error) {
          return 0;
        }
      },

      // Favorite actions
      addFavorite: (favorite) => {
        const newFavorite: Favorite = {
          ...favorite,
          id: Math.random().toString(36).substr(2, 9),
          addedAt: new Date().toISOString(),
        };
        set((state) => ({ favorites: [...state.favorites, newFavorite] }));
      },

      removeFavorite: (itemId, type) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => !(f.itemId === itemId && f.type === type)),
        }));
      },

      isFavorite: (itemId, type) => {
        return get().favorites.some((f) => f.itemId === itemId && f.type === type);
      },
    }),
    {
      name: 'chessfam-storage',
      partialize: (state) => ({
        // Only persist these fields, exclude authInitialized so it starts as false on load
        user: state.user,
        bookings: state.bookings,
        conversations: state.conversations,
        messages: state.messages,
        favorites: state.favorites,
      }),
    }
  )
);
