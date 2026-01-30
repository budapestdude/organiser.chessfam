import { Request, Response } from 'express';
import pool from '../config/database';
import { notifyWaitlistUpdate } from '../services/gameNotificationService';

/**
 * Join the waitlist for a full game
 * POST /waitlist/:gameId/join
 */
export const joinWaitlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;

    // Verify game exists and is full
    const gameResult = await pool.query(
      `SELECT g.*, COUNT(gp.id) as participant_count
       FROM games g
       LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.status = 'confirmed'
       WHERE g.id = $1
       GROUP BY g.id`,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const game = gameResult.rows[0];
    const participantCount = parseInt(game.participant_count) || 0;

    // Check if game is actually full
    if (game.status !== 'full' && participantCount < game.max_players) {
      return res.status(400).json({
        success: false,
        message: 'Game is not full. You can join directly.',
        can_join_directly: true
      });
    }

    // Check if user is already a participant
    const isParticipant = await pool.query(
      `SELECT 1 FROM game_participants
       WHERE game_id = $1 AND user_id = $2
       UNION
       SELECT 1 FROM games WHERE id = $1 AND creator_id = $2`,
      [gameId, userId]
    );

    if (isParticipant.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already a participant in this game'
      });
    }

    // Check if already in waitlist
    const existing = await pool.query(
      'SELECT * FROM game_waitlist WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already on the waitlist for this game'
      });
    }

    // Add to waitlist
    await pool.query(
      'INSERT INTO game_waitlist (game_id, user_id, status) VALUES ($1, $2, \'waiting\')',
      [gameId, userId]
    );

    // Get position in waitlist
    const positionResult = await pool.query(
      `SELECT COUNT(*) as position
       FROM game_waitlist
       WHERE game_id = $1 AND joined_at <= (
         SELECT joined_at FROM game_waitlist WHERE game_id = $1 AND user_id = $2
       )`,
      [gameId, userId]
    );

    const position = parseInt(positionResult.rows[0].position);

    res.status(201).json({
      success: true,
      message: 'Added to waitlist successfully',
      data: {
        position,
        game_id: parseInt(gameId)
      }
    });
  } catch (error: any) {
    console.error('Error joining waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join waitlist',
      error: error.message
    });
  }
};

/**
 * Leave the waitlist
 * DELETE /waitlist/:gameId/leave
 */
export const leaveWaitlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;

    const result = await pool.query(
      'DELETE FROM game_waitlist WHERE game_id = $1 AND user_id = $2 RETURNING *',
      [gameId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'You are not on the waitlist for this game'
      });
    }

    res.json({
      success: true,
      message: 'Removed from waitlist successfully'
    });
  } catch (error: any) {
    console.error('Error leaving waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave waitlist',
      error: error.message
    });
  }
};

/**
 * Get waitlist status for current user
 * GET /waitlist/:gameId/status
 */
export const getWaitlistStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;

    const result = await pool.query(
      `SELECT
        w.*,
        (SELECT COUNT(*) FROM game_waitlist WHERE game_id = $1 AND joined_at <= w.joined_at) as position,
        (SELECT COUNT(*) FROM game_waitlist WHERE game_id = $1) as total_waiting
       FROM game_waitlist w
       WHERE w.game_id = $1 AND w.user_id = $2`,
      [gameId, userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          on_waitlist: false,
          game_id: parseInt(gameId)
        }
      });
    }

    res.json({
      success: true,
      data: {
        on_waitlist: true,
        ...result.rows[0],
        position: parseInt(result.rows[0].position),
        total_waiting: parseInt(result.rows[0].total_waiting)
      }
    });
  } catch (error: any) {
    console.error('Error getting waitlist status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get waitlist status',
      error: error.message
    });
  }
};

/**
 * Get all users on waitlist for a game (creator only)
 * GET /waitlist/:gameId/list
 */
export const getWaitlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;

    // Verify user is creator
    const gameResult = await pool.query(
      'SELECT creator_id FROM games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (gameResult.rows[0].creator_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the game creator can view the waitlist'
      });
    }

    // Get waitlist
    const result = await pool.query(
      `SELECT
        w.*,
        u.name,
        u.avatar,
        u.rating,
        ROW_NUMBER() OVER (ORDER BY w.joined_at ASC) as position
       FROM game_waitlist w
       JOIN users u ON w.user_id = u.id
       WHERE w.game_id = $1
       ORDER BY w.joined_at ASC`,
      [gameId]
    );

    res.json({
      success: true,
      data: {
        waitlist: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Error getting waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get waitlist',
      error: error.message
    });
  }
};
