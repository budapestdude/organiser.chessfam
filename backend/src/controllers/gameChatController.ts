import { Request, Response } from 'express';
import pool from '../config/database';
import { notifyNewMessage } from '../services/gameNotificationService';

/**
 * Send a message in a game chat
 * POST /game-chat/:gameId/messages
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 1000 characters)'
      });
    }

    // Verify user is participant or creator of the game
    const participantCheck = await pool.query(
      `SELECT 1 FROM games g
       LEFT JOIN game_participants gp ON g.id = gp.game_id
       WHERE g.id = $1 AND (g.creator_id = $2 OR (gp.user_id = $2 AND gp.status = 'confirmed'))
       LIMIT 1`,
      [gameId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only game participants can send messages'
      });
    }

    // Insert message
    const result = await pool.query(
      `INSERT INTO game_messages (game_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [gameId, userId, message.trim()]
    );

    // Get user info for notification
    const userResult = await pool.query(
      'SELECT name, avatar FROM users WHERE id = $1',
      [userId]
    );

    const messageData = {
      ...result.rows[0],
      user_name: userResult.rows[0].name,
      user_avatar: userResult.rows[0].avatar
    };

    // Notify via Socket.IO
    notifyNewMessage(parseInt(gameId), messageData);

    // Update stats
    await pool.query(
      `INSERT INTO user_stats (user_id, total_messages_sent)
       VALUES ($1, 1)
       ON CONFLICT (user_id) DO UPDATE
       SET total_messages_sent = user_stats.total_messages_sent + 1,
           updated_at = NOW()`,
      [userId]
    );

    res.status(201).json({
      success: true,
      data: messageData
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

/**
 * Get messages for a game
 * GET /game-chat/:gameId/messages?limit&offset
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
    const offsetNum = parseInt(offset as string) || 0;

    const result = await pool.query(
      `SELECT
        gm.*,
        u.name as user_name,
        u.avatar as user_avatar
       FROM game_messages gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.game_id = $1 AND gm.deleted = FALSE
       ORDER BY gm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [gameId, limitNum, offsetNum]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM game_messages WHERE game_id = $1 AND deleted = FALSE',
      [gameId]
    );

    res.json({
      success: true,
      data: {
        messages: result.rows.reverse(), // Return in chronological order
        total: parseInt(countResult.rows[0].count),
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

/**
 * Delete a message (soft delete)
 * DELETE /game-chat/messages/:messageId
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { messageId } = req.params;

    // Verify ownership
    const result = await pool.query(
      `UPDATE game_messages
       SET deleted = TRUE
       WHERE id = $1 AND user_id = $2 AND deleted = FALSE
       RETURNING game_id`,
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

/**
 * Edit a message
 * PUT /game-chat/messages/:messageId
 */
export const editMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { messageId } = req.params;
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 1000 characters)'
      });
    }

    // Update message
    const result = await pool.query(
      `UPDATE game_messages
       SET message = $1, edited_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted = FALSE
       RETURNING *, (SELECT name FROM users WHERE id = $3) as user_name,
                   (SELECT avatar FROM users WHERE id = $3) as user_avatar`,
      [message.trim(), messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Message updated successfully'
    });
  } catch (error: any) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message',
      error: error.message
    });
  }
};
