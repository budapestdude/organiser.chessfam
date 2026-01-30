import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let gameIo: SocketServer | null = null;

/**
 * Initialize Socket.IO server for game notifications
 * Follows the pattern from voiceSignaling.ts
 */
export function initGameNotifications(httpServer: HttpServer, corsOrigin: string) {
  gameIo = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin.split(',').map(o => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/game-notifications',
  });

  gameIo.on('connection', (socket) => {
    console.log(`[GameNotifications] Client connected: ${socket.id}`);

    // Subscribe to game updates
    socket.on('game:subscribe', (data: { gameId: number; userId: number }) => {
      const roomName = `game:${data.gameId}`;
      socket.join(roomName);
      socket.data.gameId = data.gameId;
      socket.data.userId = data.userId;
      console.log(`[GameNotifications] User ${data.userId} subscribed to game ${data.gameId}`);

      // Confirm subscription
      socket.emit('game:subscribed', {
        gameId: data.gameId,
        success: true
      });
    });

    // Unsubscribe from game
    socket.on('game:unsubscribe', (data: { gameId: number }) => {
      const roomName = `game:${data.gameId}`;
      socket.leave(roomName);
      console.log(`[GameNotifications] User unsubscribed from game ${data.gameId}`);

      socket.emit('game:unsubscribed', {
        gameId: data.gameId,
        success: true
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[GameNotifications] Client disconnected: ${socket.id}`);
      if (socket.data.gameId) {
        socket.leave(`game:${socket.data.gameId}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[GameNotifications] Socket error for ${socket.id}:`, error);
    });
  });

  console.log('[GameNotifications] Game notification system initialized on /game-notifications');
  return gameIo;
}

/**
 * Get the Socket.IO server instance
 */
export function getGameIo(): SocketServer | null {
  return gameIo;
}

// ============================================
// NOTIFICATION EMITTERS (called from controllers)
// ============================================

/**
 * Generic game update notification
 * @param gameId - The game ID
 * @param event - Event type/name
 * @param data - Event data
 */
export const notifyGameUpdate = (gameId: number, event: string, data: any) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  gameIo.to(`game:${gameId}`).emit('game:update', {
    event,
    data,
    gameId,
    timestamp: new Date().toISOString()
  });

  console.log(`[GameNotifications] Sent game:update to game ${gameId} - event: ${event}`);
};

/**
 * Notify when a player joins a game
 * @param gameId - The game ID
 * @param player - Player info { id, name, rating, avatar }
 */
export const notifyPlayerJoined = (gameId: number, player: any) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  gameIo.to(`game:${gameId}`).emit('game:player-joined', {
    player,
    gameId,
    timestamp: new Date().toISOString()
  });

  console.log(`[GameNotifications] Player ${player.id} joined game ${gameId}`);
};

/**
 * Notify when a player leaves a game
 * @param gameId - The game ID
 * @param userId - The user ID who left
 * @param userName - Optional user name
 */
export const notifyPlayerLeft = (gameId: number, userId: number, userName?: string) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  gameIo.to(`game:${gameId}`).emit('game:player-left', {
    userId,
    userName,
    gameId,
    timestamp: new Date().toISOString()
  });

  console.log(`[GameNotifications] Player ${userId} left game ${gameId}`);
};

/**
 * Notify when game status changes (open → full, etc.)
 * @param gameId - The game ID
 * @param status - New status
 * @param previousStatus - Optional previous status
 */
export const notifyGameStatusChange = (gameId: number, status: string, previousStatus?: string) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  gameIo.to(`game:${gameId}`).emit('game:status-change', {
    status,
    previousStatus,
    gameId,
    timestamp: new Date().toISOString()
  });

  console.log(`[GameNotifications] Game ${gameId} status changed: ${previousStatus} → ${status}`);
};

/**
 * Notify participants of a new chat message
 * @param gameId - The game ID
 * @param message - Message data
 */
export const notifyNewMessage = (gameId: number, message: any) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  gameIo.to(`game:${gameId}`).emit('game:message', {
    message,
    gameId,
    timestamp: new Date().toISOString()
  });

  console.log(`[GameNotifications] New message in game ${gameId} from user ${message.user_id}`);
};

/**
 * Notify waitlist updates (spot available, position change)
 * @param gameId - The game ID
 * @param action - 'spot-available' | 'position-update'
 * @param data - Additional data (userId, position, etc.)
 */
export const notifyWaitlistUpdate = (gameId: number, action: 'spot-available' | 'position-update', data: any) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  gameIo.to(`game:${gameId}`).emit('game:waitlist-update', {
    action,
    data,
    gameId,
    timestamp: new Date().toISOString()
  });

  console.log(`[GameNotifications] Waitlist update for game ${gameId} - action: ${action}`);
};

/**
 * Notify when game details are edited
 * @param gameId - The game ID
 * @param changes - Object with changed fields
 */
export const notifyGameEdited = (gameId: number, changes: any) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  gameIo.to(`game:${gameId}`).emit('game:edited', {
    changes,
    gameId,
    timestamp: new Date().toISOString()
  });

  console.log(`[GameNotifications] Game ${gameId} edited - fields: ${Object.keys(changes).join(', ')}`);
};

/**
 * Notify when game is cancelled
 * @param gameId - The game ID
 * @param reason - Optional cancellation reason
 */
export const notifyGameCancelled = (gameId: number, reason?: string) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  gameIo.to(`game:${gameId}`).emit('game:cancelled', {
    reason,
    gameId,
    timestamp: new Date().toISOString()
  });

  console.log(`[GameNotifications] Game ${gameId} cancelled${reason ? `: ${reason}` : ''}`);
};

/**
 * Send notification to a specific user (not broadcast to room)
 * @param userId - The user ID
 * @param event - Event name
 * @param data - Event data
 */
export const notifyUser = (userId: number, event: string, data: any) => {
  if (!gameIo) {
    console.warn('[GameNotifications] Socket.IO not initialized, skipping notification');
    return;
  }

  // Find all sockets for this user
  const userSockets = Array.from(gameIo.sockets.sockets.values())
    .filter(socket => socket.data.userId === userId);

  userSockets.forEach(socket => {
    socket.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  console.log(`[GameNotifications] Sent ${event} to user ${userId} (${userSockets.length} connections)`);
};
