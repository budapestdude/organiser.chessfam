import { useState, useEffect, useRef, useCallback } from 'react';

// ICE servers for NAT traversal (using free public STUN servers)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface VoiceParticipant {
  odbc: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

interface PeerConnection {
  odbc: string;
  connection: RTCPeerConnection;
  audioElement: HTMLAudioElement;
}

interface UseVoiceChatOptions {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  onParticipantJoin?: (participant: VoiceParticipant) => void;
  onParticipantLeave?: (odbc: string) => void;
  signaling: {
    sendOffer: (targetUserId: string, offer: RTCSessionDescriptionInit) => Promise<void>;
    sendAnswer: (targetUserId: string, answer: RTCSessionDescriptionInit) => Promise<void>;
    sendIceCandidate: (targetUserId: string, candidate: RTCIceCandidate) => Promise<void>;
    onOffer: (callback: (fromUserId: string, offer: RTCSessionDescriptionInit) => void) => () => void;
    onAnswer: (callback: (fromUserId: string, answer: RTCSessionDescriptionInit) => void) => () => void;
    onIceCandidate: (callback: (fromUserId: string, candidate: RTCIceCandidate) => void) => () => void;
    onUserJoined: (callback: (odbc: string, userName: string, userAvatar?: string) => void) => () => void;
    onUserLeft: (callback: (odbc: string) => void) => () => void;
    joinRoom: () => Promise<VoiceParticipant[]>;
    leaveRoom: () => Promise<void>;
  };
}

export interface UseVoiceChatReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  participants: VoiceParticipant[];
  localAudioLevel: number;
  error: string | null;
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
}

export function useVoiceChat(options: UseVoiceChatOptions): UseVoiceChatReturn {
  const { roomId, userId, signaling } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Create a peer connection for a specific user
  const createPeerConnection = useCallback(async (targetUserId: string, targetUserName: string, targetUserAvatar?: string): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming audio stream
    const audioElement = new Audio();
    audioElement.autoplay = true;

    pc.ontrack = (event) => {
      audioElement.srcObject = event.streams[0];

      // Set up audio level monitoring for this participant
      if (audioContextRef.current && event.streams[0]) {
        const source = audioContextRef.current.createMediaStreamSource(event.streams[0]);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
          if (!peerConnectionsRef.current.has(targetUserId)) return;

          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const isSpeaking = average > 20;

          setParticipants(prev => prev.map(p =>
            p.odbc === targetUserId
              ? { ...p, isSpeaking, audioLevel: average }
              : p
          ));

          requestAnimationFrame(checkAudioLevel);
        };
        checkAudioLevel();
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.sendIceCandidate(targetUserId, event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeerConnection(targetUserId);
      }
    };

    // Store the peer connection
    peerConnectionsRef.current.set(targetUserId, {
      odbc: targetUserId,
      connection: pc,
      audioElement,
    });

    // Add participant to list
    setParticipants(prev => {
      if (prev.find(p => p.odbc === targetUserId)) return prev;
      return [...prev, {
        odbc: targetUserId,
        name: targetUserName,
        avatar: targetUserAvatar,
        isMuted: false,
        isSpeaking: false,
        audioLevel: 0,
      }];
    });

    return pc;
  }, [signaling]);

  // Remove a peer connection
  const removePeerConnection = useCallback((odbc: string) => {
    const peer = peerConnectionsRef.current.get(odbc);
    if (peer) {
      peer.connection.close();
      peer.audioElement.srcObject = null;
      peerConnectionsRef.current.delete(odbc);
    }
    setParticipants(prev => prev.filter(p => p.odbc !== odbc));
    options.onParticipantLeave?.(odbc);
  }, [options]);

  // Join voice channel
  const joinVoice = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Monitor local audio level
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const checkLocalAudioLevel = () => {
        if (!analyserRef.current || !isConnected) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setLocalAudioLevel(average);

        requestAnimationFrame(checkLocalAudioLevel);
      };

      // Set up signaling listeners
      const unsubOffer = signaling.onOffer(async (fromUserId, offer) => {
        const pc = await createPeerConnection(fromUserId, 'User', undefined);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await signaling.sendAnswer(fromUserId, answer);
      });

      const unsubAnswer = signaling.onAnswer(async (fromUserId, answer) => {
        const peer = peerConnectionsRef.current.get(fromUserId);
        if (peer) {
          await peer.connection.setRemoteDescription(answer);
        }
      });

      const unsubIce = signaling.onIceCandidate(async (fromUserId, candidate) => {
        const peer = peerConnectionsRef.current.get(fromUserId);
        if (peer) {
          await peer.connection.addIceCandidate(candidate);
        }
      });

      const unsubJoin = signaling.onUserJoined(async (newUserId, newUserName, newUserAvatar) => {
        if (newUserId === userId) return;

        const pc = await createPeerConnection(newUserId, newUserName, newUserAvatar);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await signaling.sendOffer(newUserId, offer);

        options.onParticipantJoin?.({
          odbc: newUserId,
          name: newUserName,
          avatar: newUserAvatar,
          isMuted: false,
          isSpeaking: false,
          audioLevel: 0,
        });
      });

      const unsubLeave = signaling.onUserLeft((leftUserId) => {
        removePeerConnection(leftUserId);
      });

      cleanupFunctionsRef.current = [unsubOffer, unsubAnswer, unsubIce, unsubJoin, unsubLeave];

      // Join the room and get existing participants
      const existingParticipants = await signaling.joinRoom();

      // Create peer connections with existing participants
      for (const participant of existingParticipants) {
        if (participant.odbc !== userId) {
          const pc = await createPeerConnection(participant.odbc, participant.name, participant.avatar);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await signaling.sendOffer(participant.odbc, offer);
        }
      }

      setIsConnected(true);
      checkLocalAudioLevel();

    } catch (err: any) {
      console.error('Failed to join voice:', err);
      setError(err.message || 'Failed to join voice channel');
      leaveVoice();
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, signaling, userId, createPeerConnection, removePeerConnection, options]);

  // Leave voice channel
  const leaveVoice = useCallback(() => {
    // Clean up signaling listeners
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];

    // Close all peer connections
    peerConnectionsRef.current.forEach((peer) => {
      peer.connection.close();
      peer.audioElement.srcObject = null;
    });
    peerConnectionsRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Leave the signaling room
    signaling.leaveRoom().catch(console.error);

    setIsConnected(false);
    setParticipants([]);
    setLocalAudioLevel(0);
  }, [signaling]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);

  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    peerConnectionsRef.current.forEach((peer) => {
      peer.audioElement.muted = !isDeafened;
    });
    setIsDeafened(!isDeafened);
  }, [isDeafened]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, []);

  // Cleanup on room change
  useEffect(() => {
    return () => {
      if (isConnected) {
        leaveVoice();
      }
    };
  }, [roomId]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    isDeafened,
    participants,
    localAudioLevel,
    error,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
  };
}
