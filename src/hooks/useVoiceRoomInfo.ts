import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface VoiceRoomUser {
  odbc: string;
  userName: string;
  userAvatar?: string;
}

interface UseVoiceRoomInfoOptions {
  roomId: string;
  enabled?: boolean;
}

export interface UseVoiceRoomInfoReturn {
  users: VoiceRoomUser[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// Get the voice signaling server URL
const getVoiceServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  return apiUrl.replace(/\/api\/v1$/, '');
};

export function useVoiceRoomInfo(options: UseVoiceRoomInfoOptions): UseVoiceRoomInfoReturn {
  const { roomId, enabled = true } = options;

  const [users, setUsers] = useState<VoiceRoomUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  const refresh = useCallback(() => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit('voice:get-room-info', { roomId });
    }
  }, [roomId]);

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const serverUrl = getVoiceServerUrl();

    const socket = io(serverUrl, {
      path: '/voice',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[VoiceRoomInfo] Connected to server');
      isConnectedRef.current = true;
      // Subscribe to room updates
      socket.emit('voice:subscribe', { roomId });
    });

    socket.on('connect_error', (err) => {
      console.error('[VoiceRoomInfo] Connection error:', err);
      setError('Failed to connect to voice server');
      setIsLoading(false);
    });

    socket.on('voice:room-info', (data: { roomId: string; users: VoiceRoomUser[] }) => {
      if (data.roomId === roomId) {
        console.log('[VoiceRoomInfo] Received room info:', data.users.length, 'users');
        setUsers(data.users);
        setIsLoading(false);
      }
    });

    socket.on('disconnect', () => {
      console.log('[VoiceRoomInfo] Disconnected');
      isConnectedRef.current = false;
    });

    return () => {
      if (socket) {
        socket.emit('voice:unsubscribe', { roomId });
        socket.disconnect();
      }
      socketRef.current = null;
      isConnectedRef.current = false;
    };
  }, [roomId, enabled]);

  return {
    users,
    isLoading,
    error,
    refresh,
  };
}
