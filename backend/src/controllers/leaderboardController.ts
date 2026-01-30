import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Get leaderboard by type
 * GET /leaderboards?type=xp&period=all_time&limit=100
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { type = 'xp', period = 'all_time', limit = 100 } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 100, 1000); // Max 1000

    let query = '';
    let params: any[] = [];

    switch (type) {
      case 'xp':
        query = `
          SELECT u.id, u.name, u.avatar, u.xp as score, u.level,
                 ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.level DESC) as rank
          FROM users u
          ORDER BY u.xp DESC, u.level DESC
          LIMIT $1
        `;
        params = [limitNum];
        break;

      case 'level':
        query = `
          SELECT u.id, u.name, u.avatar, u.level as score, u.xp,
                 ROW_NUMBER() OVER (ORDER BY u.level DESC, u.xp DESC) as rank
          FROM users u
          ORDER BY u.level DESC, u.xp DESC
          LIMIT $1
        `;
        params = [limitNum];
        break;

      case 'games_played':
        query = `
          SELECT u.id, u.name, u.avatar, us.total_games_completed as score,
                 ROW_NUMBER() OVER (ORDER BY us.total_games_completed DESC) as rank
          FROM users u
          JOIN user_stats us ON u.id = us.user_id
          WHERE us.total_games_completed > 0
          ORDER BY us.total_games_completed DESC
          LIMIT $1
        `;
        params = [limitNum];
        break;

      case 'streak':
        query = `
          SELECT u.id, u.name, u.avatar, us.consecutive_checkin_days as score,
                 ROW_NUMBER() OVER (ORDER BY us.consecutive_checkin_days DESC) as rank
          FROM users u
          JOIN user_stats us ON u.id = us.user_id
          WHERE us.consecutive_checkin_days > 0
          ORDER BY us.consecutive_checkin_days DESC
          LIMIT $1
        `;
        params = [limitNum];
        break;

      case 'reviews':
        query = `
          SELECT u.id, u.name, u.avatar, us.total_reviews_given as score,
                 ROW_NUMBER() OVER (ORDER BY us.total_reviews_given DESC) as rank
          FROM users u
          JOIN user_stats us ON u.id = us.user_id
          WHERE us.total_reviews_given > 0
          ORDER BY us.total_reviews_given DESC
          LIMIT $1
        `;
        params = [limitNum];
        break;

      case 'rating':
        query = `
          SELECT u.id, u.name, u.avatar, u.rating as score,
                 ROW_NUMBER() OVER (ORDER BY u.rating DESC NULLS LAST) as rank
          FROM users u
          WHERE u.rating IS NOT NULL
          ORDER BY u.rating DESC
          LIMIT $1
        `;
        params = [limitNum];
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Invalid leaderboard type. Allowed: xp, level, games_played, streak, reviews, rating`
        });
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        type,
        period,
        leaderboard: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};

/**
 * Get user's rank on a specific leaderboard
 * GET /leaderboards/rank?type=xp
 */
export const getUserRank = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { type = 'xp' } = req.query;

    let query = '';
    let params: any[] = [userId];

    switch (type) {
      case 'xp':
        query = `
          SELECT COUNT(*) + 1 as rank
          FROM users
          WHERE xp > (SELECT xp FROM users WHERE id = $1)
        `;
        break;

      case 'level':
        query = `
          SELECT COUNT(*) + 1 as rank
          FROM users
          WHERE level > (SELECT level FROM users WHERE id = $1)
             OR (level = (SELECT level FROM users WHERE id = $1)
                 AND xp > (SELECT xp FROM users WHERE id = $1))
        `;
        break;

      case 'games_played':
        query = `
          SELECT COUNT(*) + 1 as rank
          FROM user_stats
          WHERE total_games_completed > (
            SELECT total_games_completed FROM user_stats WHERE user_id = $1
          )
        `;
        break;

      case 'streak':
        query = `
          SELECT COUNT(*) + 1 as rank
          FROM user_stats
          WHERE consecutive_checkin_days > (
            SELECT consecutive_checkin_days FROM user_stats WHERE user_id = $1
          )
        `;
        break;

      case 'reviews':
        query = `
          SELECT COUNT(*) + 1 as rank
          FROM user_stats
          WHERE total_reviews_given > (
            SELECT total_reviews_given FROM user_stats WHERE user_id = $1
          )
        `;
        break;

      case 'rating':
        query = `
          SELECT COUNT(*) + 1 as rank
          FROM users
          WHERE rating > (SELECT rating FROM users WHERE id = $1)
            AND rating IS NOT NULL
        `;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid leaderboard type'
        });
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        rank: parseInt(result.rows[0].rank),
        type: type as string
      }
    });
  } catch (error: any) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user rank',
      error: error.message
    });
  }
};
