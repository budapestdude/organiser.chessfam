// Real-time context for /live page
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, type SupabaseRealtimeChannel } from '../lib/supabase';
import type {
  Community,
  Message,
  CheckIn,
  BubbleRoom,
  PinnedChat,
  UserProfile,
  EventTag,
} from '../types/live';
import {
  communitiesApi,
  messagesApi,
  presenceApi,
  tagsApi,
  bubbleApi,
  pinnedChatsApi,
  profilesApi,
} from '../api/live';

// ============================================
// TYPES
// ============================================

interface LiveContextState {
  // Current user
  currentUser: UserProfile | null;
  isAuthenticated: boolean;

  // Communities
  communities: Map<string, Community>;
  activeCommunityId: string | null;

  // Messages (per community)
  messages: Map<string, Message[]>;
  loadingMessages: Set<string>;

  // Presence (per community)
  onlineUsers: Map<string, CheckIn[]>;
  checkedInCommunityId: string | null;

  // Tags (per community)
  communityTags: Map<string, EventTag[]>;

  // My Bubble
  bubbleRooms: BubbleRoom[];
  pinnedChats: PinnedChat[];

  // UI State
  isConnected: boolean;
  error: string | null;
}

interface LiveContextActions {
  // Community actions
  setActiveCommunity: (communityId: string | null) => void;
  loadCommunity: (communityId: string) => Promise<void>;
  loadCommunitiesByCity: (city: string) => Promise<Community[]>;
  unsubscribeFromCommunity: (communityId: string) => void;

  // Message actions
  loadMessages: (communityId: string, loadMore?: boolean) => Promise<void>;
  sendMessage: (communityId: string, content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;

  // Presence actions
  checkIn: (communityId: string) => Promise<void>;
  checkOut: () => Promise<void>;

  // Tag actions
  addTag: (communityId: string, tag: EventTag, expiresInMinutes?: number) => Promise<void>;
  removeTag: (communityId: string, tag: EventTag) => Promise<void>;

  // Bubble actions
  loadBubble: () => Promise<void>;
  addToBubble: (communityId: string, size?: 'small' | 'medium' | 'large') => Promise<void>;
  removeFromBubble: (communityId: string) => Promise<void>;
  updateBubble: (rooms: BubbleRoom[]) => Promise<void>;

  // Pinned chats actions
  loadPinnedChats: () => Promise<void>;
  pinChat: (communityId: string) => Promise<void>;
  unpinChat: (communityId: string) => Promise<void>;

  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

type LiveContextValue = LiveContextState & LiveContextActions;

// ============================================
// CONTEXT
// ============================================

const LiveContext = createContext<LiveContextValue | null>(null);

export const useLive = () => {
  const context = useContext(LiveContext);
  if (!context) {
    throw new Error('useLive must be used within a LiveProvider');
  }
  return context;
};

// ============================================
// PROVIDER
// ============================================

export const LiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [communities, setCommunities] = useState<Map<string, Community>>(new Map());
  const [activeCommunityId, setActiveCommunityIdState] = useState<string | null>(null);
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [loadingMessages, setLoadingMessages] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Map<string, CheckIn[]>>(new Map());
  const [checkedInCommunityId, setCheckedInCommunityId] = useState<string | null>(null);
  const [communityTags, setCommunityTags] = useState<Map<string, EventTag[]>>(new Map());
  const [bubbleRooms, setBubbleRooms] = useState<BubbleRoom[]>([]);
  const [pinnedChats, setPinnedChats] = useState<PinnedChat[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const channelsRef = useRef<Map<string, SupabaseRealtimeChannel>>(new Map());
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ============================================
  // AUTH & INITIALIZATION
  // ============================================

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        const profile = await profilesApi.getMe();
        setCurrentUser(profile);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: { user: { id: string } } | null) => {
      setIsAuthenticated(!!session?.user);

      if (session?.user) {
        const profile = await profilesApi.getMe();
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
        // Clean up on logout
        setCheckedInCommunityId(null);
        setBubbleRooms([]);
        setPinnedChats([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================

  const subscribeToCommumity = useCallback((communityId: string) => {
    // Don't subscribe if already subscribed
    if (channelsRef.current.has(communityId)) return;

    const channel = supabase
      .channel(`community:${communityId}`)
      // Messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const msg = payload.new;
          setMessages((prev) => {
            const current = prev.get(communityId) || [];
            // Avoid duplicates
            if (current.find((m) => m.id === msg.id)) return prev;
            const newMessage: Message = {
              id: msg.id as string,
              communityId: msg.community_id as string,
              userId: msg.user_id as string | undefined,
              content: msg.content as string,
              replyToId: msg.reply_to_id as string | undefined,
              isEdited: msg.is_edited as boolean,
              isDeleted: msg.is_deleted as boolean,
              createdAt: msg.created_at as string,
              editedAt: msg.edited_at as string | undefined,
              deletedAt: msg.deleted_at as string | undefined,
            };
            return new Map(prev).set(communityId, [...current, newMessage]);
          });
        }
      )
      // Check-ins (presence)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins',
          filter: `community_id=eq.${communityId}`,
        },
        async () => {
          // Refresh online users for this community
          const users = await presenceApi.getByCommumity(communityId);
          setOnlineUsers((prev) => new Map(prev).set(communityId, users));
        }
      )
      // Tags
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_tags',
          filter: `community_id=eq.${communityId}`,
        },
        async () => {
          // Refresh tags for this community
          const tags = await tagsApi.getByCommumity(communityId);
          setCommunityTags((prev) => new Map(prev).set(communityId, tags.map((t) => t.tag)));
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelsRef.current.set(communityId, channel);
  }, []);

  const unsubscribeFromCommunity = useCallback((communityId: string) => {
    const channel = channelsRef.current.get(communityId);
    if (channel) {
      supabase.removeChannel(channel);
      channelsRef.current.delete(communityId);
    }
  }, []);

  // Clean up subscriptions on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  // ============================================
  // HEARTBEAT FOR PRESENCE
  // ============================================

  useEffect(() => {
    if (checkedInCommunityId) {
      // Send heartbeat every 30 seconds
      heartbeatIntervalRef.current = setInterval(() => {
        presenceApi.heartbeat(checkedInCommunityId);
      }, 30000);

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [checkedInCommunityId]);

  // ============================================
  // COMMUNITY ACTIONS
  // ============================================

  const setActiveCommunity = useCallback((communityId: string | null) => {
    setActiveCommunityIdState(communityId);

    if (communityId) {
      subscribeToCommumity(communityId);
    }
  }, [subscribeToCommumity]);

  const loadCommunity = useCallback(async (communityId: string) => {
    try {
      const community = await communitiesApi.getById(communityId);
      if (community) {
        setCommunities((prev) => new Map(prev).set(communityId, community));

        // Also load tags
        if (community.activeTags) {
          setCommunityTags((prev) => new Map(prev).set(communityId, community.activeTags!));
        }
      }
    } catch (err) {
      setError(`Failed to load community: ${err}`);
    }
  }, []);

  const loadCommunitiesByCity = useCallback(async (city: string): Promise<Community[]> => {
    try {
      const cityCommunnities = await communitiesApi.getByCity(city);
      cityCommunnities.forEach((c) => {
        setCommunities((prev) => new Map(prev).set(c.id, c));
      });
      return cityCommunnities;
    } catch (err) {
      setError(`Failed to load communities: ${err}`);
      return [];
    }
  }, []);

  // ============================================
  // MESSAGE ACTIONS
  // ============================================

  const loadMessages = useCallback(async (communityId: string, loadMore = false) => {
    if (loadingMessages.has(communityId)) return;

    setLoadingMessages((prev) => new Set(prev).add(communityId));

    try {
      const currentMessages = messages.get(communityId) || [];
      const before = loadMore && currentMessages.length > 0 ? currentMessages[0].createdAt : undefined;

      const result = await messagesApi.getByCommumity(communityId, { before, limit: 50 });

      setMessages((prev) => {
        const existing = loadMore ? (prev.get(communityId) || []) : [];
        return new Map(prev).set(communityId, [...result.data, ...existing]);
      });
    } catch (err) {
      setError(`Failed to load messages: ${err}`);
    } finally {
      setLoadingMessages((prev) => {
        const next = new Set(prev);
        next.delete(communityId);
        return next;
      });
    }
  }, [messages, loadingMessages]);

  const sendMessage = useCallback(async (communityId: string, content: string, replyToId?: string) => {
    try {
      await messagesApi.send({ communityId, content, replyToId });
      // Message will be added via realtime subscription
    } catch (err) {
      setError(`Failed to send message: ${err}`);
      throw err;
    }
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await messagesApi.edit(messageId, content);
    } catch (err) {
      setError(`Failed to edit message: ${err}`);
      throw err;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await messagesApi.delete(messageId);
    } catch (err) {
      setError(`Failed to delete message: ${err}`);
      throw err;
    }
  }, []);

  // ============================================
  // PRESENCE ACTIONS
  // ============================================

  const checkIn = useCallback(async (communityId: string) => {
    try {
      await presenceApi.checkIn(communityId);
      setCheckedInCommunityId(communityId);
    } catch (err) {
      setError(`Failed to check in: ${err}`);
      throw err;
    }
  }, []);

  const checkOut = useCallback(async () => {
    try {
      if (checkedInCommunityId) {
        await presenceApi.checkOut(checkedInCommunityId);
      }
      setCheckedInCommunityId(null);
    } catch (err) {
      setError(`Failed to check out: ${err}`);
      throw err;
    }
  }, [checkedInCommunityId]);

  // ============================================
  // TAG ACTIONS
  // ============================================

  const addTag = useCallback(async (communityId: string, tag: EventTag, expiresInMinutes?: number) => {
    try {
      await tagsApi.add(communityId, tag, expiresInMinutes);
    } catch (err) {
      setError(`Failed to add tag: ${err}`);
      throw err;
    }
  }, []);

  const removeTag = useCallback(async (communityId: string, tag: EventTag) => {
    try {
      await tagsApi.remove(communityId, tag);
    } catch (err) {
      setError(`Failed to remove tag: ${err}`);
      throw err;
    }
  }, []);

  // ============================================
  // BUBBLE ACTIONS
  // ============================================

  const loadBubble = useCallback(async () => {
    try {
      const rooms = await bubbleApi.get();
      setBubbleRooms(rooms);
    } catch (err) {
      setError(`Failed to load ChessFam: ${err}`);
    }
  }, []);

  const addToBubble = useCallback(async (communityId: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    try {
      const room = await bubbleApi.addRoom(communityId, size);
      setBubbleRooms((prev) => [...prev, room]);
    } catch (err) {
      setError(`Failed to add to ChessFam: ${err}`);
      throw err;
    }
  }, []);

  const removeFromBubble = useCallback(async (communityId: string) => {
    try {
      await bubbleApi.removeRoom(communityId);
      setBubbleRooms((prev) => prev.filter((r) => r.communityId !== communityId));
    } catch (err) {
      setError(`Failed to remove from ChessFam: ${err}`);
      throw err;
    }
  }, []);

  const updateBubble = useCallback(async (rooms: BubbleRoom[]) => {
    try {
      await bubbleApi.update({
        rooms: rooms.map((r, i) => ({
          communityId: r.communityId,
          position: i,
          size: r.size,
          isPinned: r.isPinned,
        })),
      });
      setBubbleRooms(rooms);
    } catch (err) {
      setError(`Failed to update ChessFam: ${err}`);
      throw err;
    }
  }, []);

  // ============================================
  // PINNED CHATS ACTIONS
  // ============================================

  const loadPinnedChats = useCallback(async () => {
    try {
      const chats = await pinnedChatsApi.get();
      setPinnedChats(chats);
    } catch (err) {
      setError(`Failed to load pinned chats: ${err}`);
    }
  }, []);

  const pinChat = useCallback(async (communityId: string) => {
    try {
      const chat = await pinnedChatsApi.pin(communityId);
      setPinnedChats((prev) => [...prev, chat]);
    } catch (err) {
      setError(`Failed to pin chat: ${err}`);
      throw err;
    }
  }, []);

  const unpinChat = useCallback(async (communityId: string) => {
    try {
      await pinnedChatsApi.unpin(communityId);
      setPinnedChats((prev) => prev.filter((c) => c.communityId !== communityId));
    } catch (err) {
      setError(`Failed to unpin chat: ${err}`);
      throw err;
    }
  }, []);

  // ============================================
  // PROFILE ACTIONS
  // ============================================

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const profile = await profilesApi.update(updates);
      setCurrentUser(profile);
    } catch (err) {
      setError(`Failed to update profile: ${err}`);
      throw err;
    }
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: LiveContextValue = {
    // State
    currentUser,
    isAuthenticated,
    communities,
    activeCommunityId,
    messages,
    loadingMessages,
    onlineUsers,
    checkedInCommunityId,
    communityTags,
    bubbleRooms,
    pinnedChats,
    isConnected,
    error,

    // Actions
    setActiveCommunity,
    loadCommunity,
    loadCommunitiesByCity,
    unsubscribeFromCommunity,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    checkIn,
    checkOut,
    addTag,
    removeTag,
    loadBubble,
    addToBubble,
    removeFromBubble,
    updateBubble,
    loadPinnedChats,
    pinChat,
    unpinChat,
    updateProfile,
  };

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
};
