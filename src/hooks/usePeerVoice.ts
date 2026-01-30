import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';
import type { MediaConnection } from 'peerjs';

export interface VoiceParticipant {
  odbc: string;
  peerId: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

interface PeerCall {
  odbc: string;
  peerId: string;
  call: MediaConnection;
  audioElement: HTMLAudioElement;
  stream: MediaStream;
}

interface UsePeerVoiceOptions {
  roomId: string;
  odbc: string;
  userName: string;
  userAvatar?: string;
}

export interface UsePeerVoiceReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  participants: VoiceParticipant[];
  localAudioLevel: number;
  error: string | null;
  myPeerId: string | null;
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  callPeer: (peerId: string) => void;
}

// Get the voice signaling server URL
const getVoiceServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  // Extract base URL (remove /api/v1)
  return apiUrl.replace(/\/api\/v1$/, '');
};

export function usePeerVoice(options: UsePeerVoiceOptions): UsePeerVoiceReturn {
  const { roomId, odbc, userName, userAvatar } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callsRef = useRef<Map<string, PeerCall>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isConnectedRef = useRef(false);
  const pendingCallsRef = useRef<Set<string>>(new Set());

  // Set up audio level monitoring for a remote stream
  const setupAudioMonitoring = useCallback((peerId: string, stream: MediaStream) => {
    if (!audioContextRef.current) return;

    try {
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        if (!callsRef.current.has(peerId) || !isConnectedRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        setParticipants(prev => prev.map(p =>
          p.peerId === peerId
            ? { ...p, isSpeaking: avg > 15, audioLevel: avg }
            : p
        ));

        requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch (e) {
      console.error('Failed to set up audio monitoring:', e);
    }
  }, []);

  // Handle receiving a remote stream
  const handleRemoteStream = useCallback((peerId: string, remoteStream: MediaStream, call: MediaConnection, participantInfo?: { name?: string; avatar?: string; odbc?: string }) => {
    console.log('[Voice] Received remote stream from:', peerId);
    console.log('[Voice] Stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));

    // Create audio element and attach to DOM
    const audioElement = document.createElement('audio');
    audioElement.id = `peer-audio-${peerId}`;
    audioElement.srcObject = remoteStream;
    audioElement.autoplay = true;
    audioElement.volume = 1.0;
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);

    // Handle autoplay
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => console.log('[Voice] Audio playback started for:', peerId))
        .catch(err => {
          console.warn('[Voice] Audio autoplay blocked:', err);
          const resumeAudio = () => {
            audioElement.play().catch(console.error);
            document.removeEventListener('click', resumeAudio);
          };
          document.addEventListener('click', resumeAudio);
        });
    }

    // Store the call
    callsRef.current.set(peerId, {
      odbc: participantInfo?.odbc || peerId,
      peerId,
      call,
      audioElement,
      stream: remoteStream,
    });

    // Add/update participant
    setParticipants(prev => {
      const existing = prev.find(p => p.peerId === peerId);
      if (existing) return prev;
      return [...prev, {
        odbc: participantInfo?.odbc || peerId,
        peerId,
        name: participantInfo?.name || call.metadata?.name || 'User',
        avatar: participantInfo?.avatar || call.metadata?.avatar,
        isMuted: false,
        isSpeaking: false,
        audioLevel: 0,
      }];
    });

    // Start audio monitoring
    setupAudioMonitoring(peerId, remoteStream);

    // Remove from pending
    pendingCallsRef.current.delete(peerId);
  }, [setupAudioMonitoring]);

  // Handle incoming call
  const handleIncomingCall = useCallback((call: MediaConnection) => {
    if (!localStreamRef.current) {
      console.warn('[Voice] Received call but no local stream');
      return;
    }

    console.log('[Voice] Incoming call from:', call.peer);

    // Answer the call
    call.answer(localStreamRef.current);

    call.on('stream', (remoteStream) => {
      handleRemoteStream(call.peer, remoteStream, call, call.metadata);
    });

    call.on('close', () => {
      console.log('[Voice] Call closed:', call.peer);
      const peerCall = callsRef.current.get(call.peer);
      if (peerCall) {
        peerCall.audioElement.srcObject = null;
        peerCall.audioElement.remove();
        callsRef.current.delete(call.peer);
      }
      setParticipants(prev => prev.filter(p => p.peerId !== call.peer));
    });

    call.on('error', (err) => {
      console.error('[Voice] Call error:', err);
    });
  }, [handleRemoteStream]);

  // Call a peer
  const callPeer = useCallback((peerId: string) => {
    if (!peerRef.current || !localStreamRef.current) {
      console.warn('[Voice] Cannot call - peer or stream not ready');
      return;
    }

    if (callsRef.current.has(peerId) || pendingCallsRef.current.has(peerId)) {
      console.log('[Voice] Already connected or connecting to:', peerId);
      return;
    }

    if (peerId === peerRef.current.id) {
      console.log('[Voice] Not calling self');
      return;
    }

    console.log('[Voice] Calling peer:', peerId);
    pendingCallsRef.current.add(peerId);

    const call = peerRef.current.call(peerId, localStreamRef.current, {
      metadata: { name: userName, avatar: userAvatar, odbc }
    });

    call.on('stream', (remoteStream) => {
      handleRemoteStream(peerId, remoteStream, call);
    });

    call.on('close', () => {
      console.log('[Voice] Outgoing call closed:', peerId);
      const peerCall = callsRef.current.get(peerId);
      if (peerCall) {
        peerCall.audioElement.srcObject = null;
        peerCall.audioElement.remove();
        callsRef.current.delete(peerId);
      }
      setParticipants(prev => prev.filter(p => p.peerId !== peerId));
      pendingCallsRef.current.delete(peerId);
    });

    call.on('error', (err) => {
      console.error('[Voice] Outgoing call error:', err);
      pendingCallsRef.current.delete(peerId);
    });
  }, [userName, userAvatar, odbc, handleRemoteStream]);

  // Join voice channel
  const joinVoice = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone access
      console.log('[Voice] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      console.log('[Voice] Got microphone access');

      // Set up audio context for local level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Create PeerJS instance
      const peerId = `chess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('[Voice] Creating PeerJS with ID:', peerId);

      const peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });
      peerRef.current = peer;

      // Wait for PeerJS to connect
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('PeerJS connection timeout')), 15000);

        peer.on('open', (id) => {
          clearTimeout(timeout);
          console.log('[Voice] PeerJS connected:', id);
          setMyPeerId(id);
          resolve();
        });

        peer.on('error', (err) => {
          clearTimeout(timeout);
          console.error('[Voice] PeerJS error:', err);
          reject(err);
        });
      });

      // Listen for incoming calls
      peer.on('call', handleIncomingCall);

      // Connect to signaling server
      const serverUrl = getVoiceServerUrl();
      console.log('[Voice] Connecting to signaling server:', serverUrl);

      const socket = io(serverUrl, {
        path: '/voice',
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      // Wait for socket connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 10000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          console.log('[Voice] Socket connected:', socket.id);
          resolve();
        });

        socket.on('connect_error', (err) => {
          clearTimeout(timeout);
          console.error('[Voice] Socket connection error:', err);
          reject(err);
        });
      });

      // Join the voice room
      socket.emit('voice:join', {
        roomId,
        odbc,
        peerId: peer.id,
        userName,
        userAvatar,
      });

      // Handle receiving list of existing peers
      socket.on('voice:peers', (data: { peers: { odbc: string; peerId: string; userName: string; userAvatar?: string }[] }) => {
        console.log('[Voice] Received peer list:', data.peers.length, 'peers');

        // Add them to participants and initiate calls
        for (const remotePeer of data.peers) {
          if (remotePeer.peerId !== peer.id) {
            // Add as participant first
            setParticipants(prev => {
              if (prev.find(p => p.peerId === remotePeer.peerId)) return prev;
              return [...prev, {
                odbc: remotePeer.odbc,
                peerId: remotePeer.peerId,
                name: remotePeer.userName,
                avatar: remotePeer.userAvatar,
                isMuted: false,
                isSpeaking: false,
                audioLevel: 0,
              }];
            });

            // Initiate call with slight delay to avoid overwhelming
            setTimeout(() => {
              if (isConnectedRef.current) {
                callPeer(remotePeer.peerId);
              }
            }, 500 + Math.random() * 1000);
          }
        }
      });

      // Handle new user joining
      socket.on('voice:user-joined', (data: { odbc: string; peerId: string; userName: string; userAvatar?: string }) => {
        console.log('[Voice] User joined:', data.userName, data.peerId);

        // Add as participant (call will come from them since they're new)
        setParticipants(prev => {
          if (prev.find(p => p.peerId === data.peerId)) return prev;
          return [...prev, {
            odbc: data.odbc,
            peerId: data.peerId,
            name: data.userName,
            avatar: data.userAvatar,
            isMuted: false,
            isSpeaking: false,
            audioLevel: 0,
          }];
        });
      });

      // Handle user leaving
      socket.on('voice:user-left', (data: { odbc: string; peerId: string }) => {
        console.log('[Voice] User left:', data.peerId);

        const peerCall = callsRef.current.get(data.peerId);
        if (peerCall) {
          peerCall.call.close();
          peerCall.audioElement.srcObject = null;
          peerCall.audioElement.remove();
          callsRef.current.delete(data.peerId);
        }

        setParticipants(prev => prev.filter(p => p.peerId !== data.peerId));
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('[Voice] Socket disconnected');
      });

      // Monitor local audio level
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const checkLocalLevel = () => {
        if (!analyserRef.current || !isConnectedRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setLocalAudioLevel(avg);
        requestAnimationFrame(checkLocalLevel);
      };

      setIsConnected(true);
      isConnectedRef.current = true;
      checkLocalLevel();

      console.log('[Voice] Successfully joined voice channel');

    } catch (err: any) {
      console.error('[Voice] Failed to join:', err);
      setError(err.message || 'Failed to join voice channel');
      leaveVoice();
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, roomId, odbc, userName, userAvatar, handleIncomingCall, callPeer]);

  // Leave voice channel
  const leaveVoice = useCallback(() => {
    console.log('[Voice] Leaving voice channel');
    isConnectedRef.current = false;

    // Notify server
    if (socketRef.current) {
      socketRef.current.emit('voice:leave', { roomId, odbc });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Close all calls
    callsRef.current.forEach((peerCall) => {
      peerCall.call.close();
      peerCall.audioElement.srcObject = null;
      peerCall.audioElement.remove();
    });
    callsRef.current.clear();
    pendingCallsRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setIsConnected(false);
    setParticipants([]);
    setLocalAudioLevel(0);
    setMyPeerId(null);
  }, [roomId, odbc]);

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
    callsRef.current.forEach((peerCall) => {
      peerCall.audioElement.muted = !isDeafened;
    });
    setIsDeafened(!isDeafened);
  }, [isDeafened]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isMuted,
    isDeafened,
    participants,
    localAudioLevel,
    error,
    myPeerId,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
    callPeer,
  };
}
