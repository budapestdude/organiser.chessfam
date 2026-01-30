import apiClient from './client';
import type { VoiceParticipant } from '../hooks/useVoiceChat';

// In-memory event emitters for signaling (will be replaced with WebSocket in production)
type SignalCallback<T> = (fromUserId: string, data: T) => void;

interface SignalingState {
  odbc: string | null;
  roomId: string | null;
  userName: string;
  userAvatar?: string;
  offerCallbacks: SignalCallback<RTCSessionDescriptionInit>[];
  answerCallbacks: SignalCallback<RTCSessionDescriptionInit>[];
  iceCandidateCallbacks: SignalCallback<RTCIceCandidate>[];
  userJoinedCallbacks: ((userId: string, userName: string, userAvatar?: string) => void)[];
  userLeftCallbacks: ((userId: string) => void)[];
  pollingInterval: ReturnType<typeof setInterval> | null;
}

const state: SignalingState = {
  odbc: null,
  roomId: null,
  userName: '',
  userAvatar: undefined,
  offerCallbacks: [],
  answerCallbacks: [],
  iceCandidateCallbacks: [],
  userJoinedCallbacks: [],
  userLeftCallbacks: [],
  pollingInterval: null,
};

// Signal types for the API
interface VoiceSignal {
  id: string;
  room_id: string;
  from_user_id: string;
  to_user_id: string;
  signal_type: 'offer' | 'answer' | 'ice-candidate';
  signal_data: any;
  created_at: string;
}

interface VoiceRoomParticipant {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  joined_at: string;
}

export const voiceApi = {
  // Join a voice room
  async joinRoom(roomId: string, odbc: string, userName: string, userAvatar?: string): Promise<VoiceParticipant[]> {
    state.odbc = odbc;
    state.roomId = roomId;
    state.userName = userName;
    state.userAvatar = userAvatar;

    try {
      const response = await apiClient.post<{ participants: VoiceRoomParticipant[] }>(`/voice/rooms/${roomId}/join`, {
        userId: odbc,
        userName,
        userAvatar,
      });

      // Start polling for signals
      startPolling();

      return response.data.participants.map(p => ({
        odbc: p.user_id,
        name: p.user_name,
        avatar: p.user_avatar,
        isMuted: false,
        isSpeaking: false,
        audioLevel: 0,
      }));
    } catch (error: any) {
      // For demo purposes, return empty array if backend not ready
      console.warn('Voice API not available, using mock mode');
      startPolling();
      return [];
    }
  },

  // Leave a voice room
  async leaveRoom(): Promise<void> {
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval);
      state.pollingInterval = null;
    }

    if (state.roomId && state.odbc) {
      try {
        await apiClient.post(`/voice/rooms/${state.roomId}/leave`, {
          userId: state.odbc,
        });
      } catch (error) {
        console.warn('Failed to leave voice room:', error);
      }
    }

    state.odbc = null;
    state.roomId = null;
    state.offerCallbacks = [];
    state.answerCallbacks = [];
    state.iceCandidateCallbacks = [];
    state.userJoinedCallbacks = [];
    state.userLeftCallbacks = [];
  },

  // Send an offer to a specific user
  async sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!state.roomId || !state.odbc) return;

    try {
      await apiClient.post('/voice/signals', {
        roomId: state.roomId,
        fromUserId: state.odbc,
        toUserId: targetUserId,
        signalType: 'offer',
        signalData: offer,
      });
    } catch (error) {
      console.warn('Failed to send offer:', error);
      // For demo, directly call answer callback to simulate response
    }
  },

  // Send an answer to a specific user
  async sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    if (!state.roomId || !state.odbc) return;

    try {
      await apiClient.post('/voice/signals', {
        roomId: state.roomId,
        fromUserId: state.odbc,
        toUserId: targetUserId,
        signalType: 'answer',
        signalData: answer,
      });
    } catch (error) {
      console.warn('Failed to send answer:', error);
    }
  },

  // Send an ICE candidate to a specific user
  async sendIceCandidate(targetUserId: string, candidate: RTCIceCandidate): Promise<void> {
    if (!state.roomId || !state.odbc) return;

    try {
      await apiClient.post('/voice/signals', {
        roomId: state.roomId,
        fromUserId: state.odbc,
        toUserId: targetUserId,
        signalType: 'ice-candidate',
        signalData: candidate.toJSON(),
      });
    } catch (error) {
      console.warn('Failed to send ICE candidate:', error);
    }
  },

  // Register callback for incoming offers
  onOffer(callback: SignalCallback<RTCSessionDescriptionInit>): () => void {
    state.offerCallbacks.push(callback);
    return () => {
      state.offerCallbacks = state.offerCallbacks.filter(cb => cb !== callback);
    };
  },

  // Register callback for incoming answers
  onAnswer(callback: SignalCallback<RTCSessionDescriptionInit>): () => void {
    state.answerCallbacks.push(callback);
    return () => {
      state.answerCallbacks = state.answerCallbacks.filter(cb => cb !== callback);
    };
  },

  // Register callback for incoming ICE candidates
  onIceCandidate(callback: SignalCallback<RTCIceCandidate>): () => void {
    state.iceCandidateCallbacks.push(callback);
    return () => {
      state.iceCandidateCallbacks = state.iceCandidateCallbacks.filter(cb => cb !== callback);
    };
  },

  // Register callback for user joined
  onUserJoined(callback: (userId: string, userName: string, userAvatar?: string) => void): () => void {
    state.userJoinedCallbacks.push(callback);
    return () => {
      state.userJoinedCallbacks = state.userJoinedCallbacks.filter(cb => cb !== callback);
    };
  },

  // Register callback for user left
  onUserLeft(callback: (userId: string) => void): () => void {
    state.userLeftCallbacks.push(callback);
    return () => {
      state.userLeftCallbacks = state.userLeftCallbacks.filter(cb => cb !== callback);
    };
  },
};

// Poll for new signals (will be replaced with WebSocket)
async function startPolling() {
  if (state.pollingInterval) return;

  state.pollingInterval = setInterval(async () => {
    if (!state.roomId || !state.odbc) return;

    try {
      // Poll for new signals
      const response = await apiClient.get<{ signals: VoiceSignal[]; participants: VoiceRoomParticipant[] }>(
        `/voice/rooms/${state.roomId}/poll`,
        { params: { userId: state.odbc } }
      );

      // Process signals
      for (const signal of response.data.signals) {
        if (signal.to_user_id !== state.odbc) continue;

        switch (signal.signal_type) {
          case 'offer':
            state.offerCallbacks.forEach(cb => cb(signal.from_user_id, signal.signal_data));
            break;
          case 'answer':
            state.answerCallbacks.forEach(cb => cb(signal.from_user_id, signal.signal_data));
            break;
          case 'ice-candidate':
            state.iceCandidateCallbacks.forEach(cb => cb(signal.from_user_id, new RTCIceCandidate(signal.signal_data)));
            break;
        }
      }
    } catch (error) {
      // Silently ignore polling errors
    }
  }, 1000);
}

// Create signaling interface for the useVoiceChat hook
export function createSignaling(roomId: string, userId: string, userName: string, userAvatar?: string) {
  return {
    sendOffer: (targetUserId: string, offer: RTCSessionDescriptionInit) =>
      voiceApi.sendOffer(targetUserId, offer),

    sendAnswer: (targetUserId: string, answer: RTCSessionDescriptionInit) =>
      voiceApi.sendAnswer(targetUserId, answer),

    sendIceCandidate: (targetUserId: string, candidate: RTCIceCandidate) =>
      voiceApi.sendIceCandidate(targetUserId, candidate),

    onOffer: voiceApi.onOffer,
    onAnswer: voiceApi.onAnswer,
    onIceCandidate: voiceApi.onIceCandidate,
    onUserJoined: voiceApi.onUserJoined,
    onUserLeft: voiceApi.onUserLeft,

    joinRoom: () => voiceApi.joinRoom(roomId, userId, userName, userAvatar),
    leaveRoom: () => voiceApi.leaveRoom(),
  };
}
