import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface GameNotification {
  event: string;
  data: any;
  timestamp: number;
}

interface UseGameNotificationsOptions {
  gameId: number | null;
  enabled?: boolean;
}

export interface UseGameNotificationsReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  notifications: GameNotification[];
  subscribe: (gameId: number) => void;
  unsubscribe: () => void;
  clearNotifications: () => void;
}

// Get the game notifications server URL
const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  // Extract base URL (remove /api/v1)
  return apiUrl.replace(/\/api\/v1$/, '');
};

export function useGameNotifications(options: UseGameNotificationsOptions): UseGameNotificationsReturn {
  const { gameId, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<GameNotification[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const subscribedGameIdRef = useRef<number | null>(null);

  // Subscribe to a game's notifications
  const subscribe = useCallback((newGameId: number) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[GameNotifications] Cannot subscribe - socket not connected');
      return;
    }

    // Unsubscribe from previous game if any
    if (subscribedGameIdRef.current && subscribedGameIdRef.current !== newGameId) {
      console.log('[GameNotifications] Unsubscribing from game:', subscribedGameIdRef.current);
      socketRef.current.emit('game:unsubscribe', { gameId: subscribedGameIdRef.current });
    }

    // Subscribe to new game
    console.log('[GameNotifications] Subscribing to game:', newGameId);
    socketRef.current.emit('game:subscribe', { gameId: newGameId });
    subscribedGameIdRef.current = newGameId;
  }, []);

  // Unsubscribe from current game
  const unsubscribe = useCallback(() => {
    if (socketRef.current && subscribedGameIdRef.current) {
      console.log('[GameNotifications] Unsubscribing from game:', subscribedGameIdRef.current);
      socketRef.current.emit('game:unsubscribe', { gameId: subscribedGameIdRef.current });
      subscribedGameIdRef.current = null;
    }
  }, []);

  // Clear notification history
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) return;

    const serverUrl = getServerUrl();
    console.log('[GameNotifications] Connecting to server:', serverUrl);

    setIsConnecting(true);
    setError(null);

    const socket = io(serverUrl, {
      path: '/game-notifications',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[GameNotifications] Socket connected:', socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // Auto-subscribe to gameId if provided
      if (gameId) {
        subscribe(gameId);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[GameNotifications] Connection error:', err);
      setError(err.message || 'Connection failed');
      setIsConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[GameNotifications] Disconnected:', reason);
      setIsConnected(false);
      subscribedGameIdRef.current = null;
    });

    // Listen to game update events
    socket.on('game:update', (data) => {
      console.log('[GameNotifications] game:update', data);
      setNotifications(prev => [...prev, {
        event: 'game:update',
        data,
        timestamp: Date.now(),
      }]);
    });

    socket.on('game:player-joined', (data) => {
      console.log('[GameNotifications] game:player-joined', data);
      setNotifications(prev => [...prev, {
        event: 'game:player-joined',
        data,
        timestamp: Date.now(),
      }]);
    });

    socket.on('game:player-left', (data) => {
      console.log('[GameNotifications] game:player-left', data);
      setNotifications(prev => [...prev, {
        event: 'game:player-left',
        data,
        timestamp: Date.now(),
      }]);
    });

    socket.on('game:status-change', (data) => {
      console.log('[GameNotifications] game:status-change', data);
      setNotifications(prev => [...prev, {
        event: 'game:status-change',
        data,
        timestamp: Date.now(),
      }]);
    });

    socket.on('game:message', (data) => {
      console.log('[GameNotifications] game:message', data);
      setNotifications(prev => [...prev, {
        event: 'game:message',
        data,
        timestamp: Date.now(),
      }]);
    });

    socket.on('game:waitlist-update', (data) => {
      console.log('[GameNotifications] game:waitlist-update', data);
      setNotifications(prev => [...prev, {
        event: 'game:waitlist-update',
        data,
        timestamp: Date.now(),
      }]);
    });

    // Cleanup on unmount
    return () => {
      console.log('[GameNotifications] Cleaning up');
      if (subscribedGameIdRef.current) {
        socket.emit('game:unsubscribe', { gameId: subscribedGameIdRef.current });
      }
      socket.disconnect();
      socketRef.current = null;
      subscribedGameIdRef.current = null;
    };
  }, [enabled]);

  // Handle gameId changes
  useEffect(() => {
    if (enabled && isConnected && gameId && gameId !== subscribedGameIdRef.current) {
      subscribe(gameId);
    }
  }, [gameId, isConnected, enabled, subscribe]);

  return {
    isConnected,
    isConnecting,
    error,
    notifications,
    subscribe,
    unsubscribe,
    clearNotifications,
  };
}
