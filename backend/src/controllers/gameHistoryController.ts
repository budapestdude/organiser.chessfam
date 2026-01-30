import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Get game history for current user
 * GET /game-history?limit=50&offset=0&status=all
 */
export const getGameHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { limit = 50, offset = 0, status } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
    const offsetNum = parseInt(offset as string) || 0;

    let statusFilter = '';
    const params: any[] = [userId, limitNum, offsetNum];

    if (status && status !== 'all') {
      statusFilter = 'AND g.status = $4';
      params.push(status);
    }

    const result = await pool.query(
      `SELECT DISTINCT
        g.*,
        u.name as creator_name,
        u.rating as creator_rating,
        u.avatar as creator_avatar,
        CASE
          WHEN g.creator_id = $1 THEN 'creator'
          ELSE 'participant'
        END as user_role,
        (SELECT COUNT(*) FROM game_participants WHERE game_id = g.id AND status = 'confirmed') as participant_count,
        EXISTS(SELECT 1 FROM game_pgn WHERE game_id = g.id) as has_pgn,
        EXISTS(SELECT 1 FROM game_reviews WHERE game_id = g.id AND reviewer_id = $1) as user_reviewed
       FROM games g
       JOIN users u ON g.creator_id = u.id
       LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.user_id = $1
       WHERE (g.creator_id = $1 OR gp.user_id = $1)
         ${statusFilter}
       ORDER BY g.game_date DESC, g.game_time DESC
       LIMIT $2 OFFSET $3`,
      params
    );

    // Get total count
    const countParams = [userId];
    if (status && status !== 'all') {
      countParams.push(status as string);
    }

    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT g.id) as total
       FROM games g
       LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.user_id = $1
       WHERE (g.creator_id = $1 OR gp.user_id = $1)
         ${statusFilter}`,
      countParams
    );

    res.json({
      success: true,
      data: {
        games: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error: any) {
    console.error('Error fetching game history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game history',
      error: error.message
    });
  }
};

/**
 * Get user's game statistics
 * GET /game-history/stats
 */
export const getGameStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM games WHERE creator_id = $1) as games_created,
        (SELECT COUNT(*) FROM game_participants WHERE user_id = $1 AND status = 'confirmed') as games_joined,
        (SELECT COUNT(DISTINCT g.id) FROM games g
         LEFT JOIN game_participants gp ON g.id = gp.game_id
         WHERE g.status = 'completed' AND (g.creator_id = $1 OR (gp.user_id = $1 AND gp.status = 'confirmed'))) as games_completed,
        (SELECT COUNT(*) FROM game_reviews WHERE reviewer_id = $1) as reviews_given,
        (SELECT AVG(game_quality_rating)::DECIMAL(3,2) FROM game_reviews WHERE reviewer_id = $1) as avg_game_quality,
        (SELECT COUNT(*) FROM game_reviews WHERE opponent_id = $1) as reviews_received,
        (SELECT AVG(opponent_rating)::DECIMAL(3,2) FROM game_reviews WHERE opponent_id = $1) as avg_opponent_rating,
        us.*
       FROM user_stats us
       WHERE us.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          games_created: 0,
          games_joined: 0,
          games_completed: 0,
          reviews_given: 0,
          reviews_received: 0
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game stats',
      error: error.message
    });
  }
};

/**
 * Get upcoming games for user
 * GET /game-history/upcoming
 */
export const getUpcomingGames = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { limit = 10 } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 10, 50);

    const result = await pool.query(
      `SELECT DISTINCT
        g.*,
        u.name as creator_name,
        u.rating as creator_rating,
        u.avatar as creator_avatar,
        (SELECT COUNT(*) FROM game_participants WHERE game_id = g.id AND status = 'confirmed') as participant_count
       FROM games g
       JOIN users u ON g.creator_id = u.id
       LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.user_id = $1
       WHERE (g.creator_id = $1 OR gp.user_id = $1)
         AND g.status IN ('open', 'full')
         AND (g.game_date > CURRENT_DATE
              OR (g.game_date = CURRENT_DATE AND g.game_time > CURRENT_TIME))
       ORDER BY g.game_date ASC, g.game_time ASC
       LIMIT $2`,
      [userId, limitNum]
    );

    res.json({
      success: true,
      data: {
        games: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching upcoming games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming games',
      error: error.message
    });
  }
};
