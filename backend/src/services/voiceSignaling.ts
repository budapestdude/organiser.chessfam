import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

interface VoiceUser {
  odbc: string;
  peerId: string;
  userName: string;
  userAvatar?: string;
  roomId: string;
  socketId: string;
  joinedAt: Date;
}

// Map of roomId -> Map of odbc -> VoiceUser
const voiceRooms = new Map<string, Map<string, VoiceUser>>();

export function initVoiceSignaling(httpServer: HttpServer, corsOrigin: string) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin.split(',').map(o => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/voice',
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Voice] Client connected: ${socket.id}`);

    // Query room participants without joining
    socket.on('voice:get-room-info', (data: { roomId: string }, callback?: (response: { users: { odbc: string; userName: string; userAvatar?: string }[] }) => void) => {
      const room = voiceRooms.get(data.roomId);
      const users = room ? Array.from(room.values()).map(u => ({
        odbc: u.odbc,
        userName: u.userName,
        userAvatar: u.userAvatar,
      })) : [];

      // Send response via callback or emit
      if (callback) {
        callback({ users });
      } else {
        socket.emit('voice:room-info', { roomId: data.roomId, users });
      }
    });

    // Subscribe to room updates without joining voice
    socket.on('voice:subscribe', (data: { roomId: string }) => {
      socket.join(`voice-observers:${data.roomId}`);
      console.log(`[Voice] Socket ${socket.id} subscribed to room ${data.roomId} updates`);

      // Send current state
      const room = voiceRooms.get(data.roomId);
      const users = room ? Array.from(room.values()).map(u => ({
        odbc: u.odbc,
        userName: u.userName,
        userAvatar: u.userAvatar,
      })) : [];
      socket.emit('voice:room-info', { roomId: data.roomId, users });
    });

    // Unsubscribe from room updates
    socket.on('voice:unsubscribe', (data: { roomId: string }) => {
      socket.leave(`voice-observers:${data.roomId}`);
    });

    // Join a voice room
    socket.on('voice:join', (data: {
      roomId: string;
      odbc: string;
      peerId: string;
      userName: string;
      userAvatar?: string;
    }) => {
      const { roomId, odbc, peerId, userName, userAvatar } = data;

      // Create room if doesn't exist
      if (!voiceRooms.has(roomId)) {
        voiceRooms.set(roomId, new Map());
      }

      const room = voiceRooms.get(roomId)!;

      // Check if user already in room (reconnection)
      const existingUser = room.get(odbc);
      if (existingUser) {
        // Update socket and peer ID
        existingUser.socketId = socket.id;
        existingUser.peerId = peerId;
      } else {
        // Add new user
        room.set(odbc, {
          odbc,
          peerId,
          userName,
          userAvatar,
          roomId,
          socketId: socket.id,
          joinedAt: new Date(),
        });
      }

      // Join socket.io room
      socket.join(`voice:${roomId}`);
      socket.data.voiceRoom = roomId;
      socket.data.odbc = odbc;

      // Get all other peers in the room
      const otherPeers = Array.from(room.values())
        .filter(u => u.odbc !== odbc)
        .map(u => ({
          odbc: u.odbc,
          peerId: u.peerId,
          userName: u.userName,
          userAvatar: u.userAvatar,
        }));

      // Send list of existing peers to the new user
      socket.emit('voice:peers', { peers: otherPeers });

      // Notify others in the room about new user
      socket.to(`voice:${roomId}`).emit('voice:user-joined', {
        odbc,
        peerId,
        userName,
        userAvatar,
      });

      // Notify observers about room update
      const allUsers = Array.from(room.values()).map(u => ({
        odbc: u.odbc,
        userName: u.userName,
        userAvatar: u.userAvatar,
      }));
      io.to(`voice-observers:${roomId}`).emit('voice:room-info', { roomId, users: allUsers });

      console.log(`[Voice] User ${userName} (${odbc}) joined room ${roomId} with peerId ${peerId}`);
      console.log(`[Voice] Room ${roomId} now has ${room.size} users`);
    });

    // Leave voice room
    socket.on('voice:leave', (data: { roomId: string; odbc: string }) => {
      handleUserLeave(socket, io, data.roomId, data.odbc);
    });

    // Handle WebRTC signaling - forward offer to specific peer
    socket.on('voice:offer', (data: {
      targetPeerId: string;
      offer: unknown; // RTCSessionDescriptionInit - passed through
      fromPeerId: string;
      fromUserName: string;
    }) => {
      // Find the socket for the target peer
      const roomId = socket.data.voiceRoom;
      if (!roomId) return;

      const room = voiceRooms.get(roomId);
      if (!room) return;

      // Find user by peerId
      for (const user of room.values()) {
        if (user.peerId === data.targetPeerId) {
          io.to(user.socketId).emit('voice:offer', {
            offer: data.offer,
            fromPeerId: data.fromPeerId,
            fromUserName: data.fromUserName,
          });
          console.log(`[Voice] Forwarded offer from ${data.fromPeerId} to ${data.targetPeerId}`);
          break;
        }
      }
    });

    // Forward answer to specific peer
    socket.on('voice:answer', (data: {
      targetPeerId: string;
      answer: unknown; // RTCSessionDescriptionInit - passed through
      fromPeerId: string;
    }) => {
      const roomId = socket.data.voiceRoom;
      if (!roomId) return;

      const room = voiceRooms.get(roomId);
      if (!room) return;

      for (const user of room.values()) {
        if (user.peerId === data.targetPeerId) {
          io.to(user.socketId).emit('voice:answer', {
            answer: data.answer,
            fromPeerId: data.fromPeerId,
          });
          console.log(`[Voice] Forwarded answer from ${data.fromPeerId} to ${data.targetPeerId}`);
          break;
        }
      }
    });

    // Forward ICE candidate to specific peer
    socket.on('voice:ice-candidate', (data: {
      targetPeerId: string;
      candidate: unknown; // RTCIceCandidate - passed through
      fromPeerId: string;
    }) => {
      const roomId = socket.data.voiceRoom;
      if (!roomId) return;

      const room = voiceRooms.get(roomId);
      if (!room) return;

      for (const user of room.values()) {
        if (user.peerId === data.targetPeerId) {
          io.to(user.socketId).emit('voice:ice-candidate', {
            candidate: data.candidate,
            fromPeerId: data.fromPeerId,
          });
          break;
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const roomId = socket.data.voiceRoom;
      const odbc = socket.data.odbc;

      if (roomId && odbc) {
        handleUserLeave(socket, io, roomId, odbc);
      }

      console.log(`[Voice] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Voice] Voice signaling initialized');
  return io;
}

function handleUserLeave(socket: Socket, io: SocketServer, roomId: string, odbc: string) {
  const room = voiceRooms.get(roomId);
  if (!room) return;

  const user = room.get(odbc);
  if (user) {
    room.delete(odbc);

    // Notify others
    socket.to(`voice:${roomId}`).emit('voice:user-left', {
      odbc,
      peerId: user.peerId,
    });

    // Notify observers about room update
    const remainingUsers = Array.from(room.values()).map(u => ({
      odbc: u.odbc,
      userName: u.userName,
      userAvatar: u.userAvatar,
    }));
    io.to(`voice-observers:${roomId}`).emit('voice:room-info', { roomId, users: remainingUsers });

    console.log(`[Voice] User ${user.userName} (${odbc}) left room ${roomId}`);

    // Clean up empty rooms
    if (room.size === 0) {
      voiceRooms.delete(roomId);
      console.log(`[Voice] Room ${roomId} deleted (empty)`);
    } else {
      console.log(`[Voice] Room ${roomId} now has ${room.size} users`);
    }
  }

  socket.leave(`voice:${roomId}`);
}

// Export for getting room info (optional API endpoint)
export function getVoiceRoomInfo(roomId: string): VoiceUser[] {
  const room = voiceRooms.get(roomId);
  if (!room) return [];
  return Array.from(room.values());
}

export function getAllVoiceRooms(): { roomId: string; userCount: number }[] {
  return Array.from(voiceRooms.entries()).map(([roomId, users]) => ({
    roomId,
    userCount: users.size,
  }));
}
