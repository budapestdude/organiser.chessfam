import { Request, Response } from 'express';
import pool from '../config/database';

const ALLOWED_BADGES = [
  'good_sport',
  'punctual',
  'skilled',
  'friendly',
  'respectful',
  'patient',
  'focused',
  'fun_opponent'
];

/**
 * Helper to award XP
 */
async function awardXP(userId: number, xp: number, reason: string) {
  await pool.query(
    `UPDATE users
     SET xp = xp + $1,
         level = FLOOR((xp + $1) / 100) + 1
     WHERE id = $2`,
    [xp, userId]
  );
  console.log(`[XP] User ${userId} earned ${xp} XP for ${reason}`);
}

/**
 * Submit or update a game review
 * POST /game-reviews/:gameId/submit
 */
export const submitReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;
    const {
      opponent_id,
      opponent_rating,
      game_quality_rating,
      comment,
      badges = [],
      reported = false,
      report_reason
    } = req.body;

    // Validate ratings
    if (opponent_rating && (opponent_rating < 1 || opponent_rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Opponent rating must be between 1 and 5'
      });
    }

    if (game_quality_rating && (game_quality_rating < 1 || game_quality_rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Game quality rating must be between 1 and 5'
      });
    }

    // Validate badges
    if (badges.length > 0) {
      const invalidBadges = badges.filter((b: string) => !ALLOWED_BADGES.includes(b));
      if (invalidBadges.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid badges: ${invalidBadges.join(', ')}. Allowed badges: ${ALLOWED_BADGES.join(', ')}`
        });
      }
    }

    // Verify user was participant in completed game
    const participantCheck = await pool.query(
      `SELECT 1 FROM games g
       LEFT JOIN game_participants gp ON g.id = gp.game_id
       WHERE g.id = $1 AND g.status = 'completed'
         AND (g.creator_id = $2 OR (gp.user_id = $2 AND gp.status = 'confirmed'))
       LIMIT 1`,
      [gameId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only participants can review completed games'
      });
    }

    // Prevent self-review
    if (opponent_id && opponent_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself'
      });
    }

    // Insert or update review
    const result = await pool.query(
      `INSERT INTO game_reviews (
        game_id, reviewer_id, opponent_id, opponent_rating,
        game_quality_rating, comment, badges, reported, report_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (game_id, reviewer_id) DO UPDATE
      SET opponent_rating = EXCLUDED.opponent_rating,
          game_quality_rating = EXCLUDED.game_quality_rating,
          comment = EXCLUDED.comment,
          badges = EXCLUDED.badges,
          reported = EXCLUDED.reported,
          report_reason = EXCLUDED.report_reason,
          updated_at = NOW()
      RETURNING *`,
      [gameId, userId, opponent_id, opponent_rating, game_quality_rating, comment, badges, reported, report_reason]
    );

    // Update reviewer stats
    await pool.query(
      `INSERT INTO user_stats (user_id, total_reviews_given)
       VALUES ($1, 1)
       ON CONFLICT (user_id) DO UPDATE
       SET total_reviews_given = user_stats.total_reviews_given + 1,
           updated_at = NOW()`,
      [userId]
    );

    // Update opponent stats if provided
    if (opponent_id) {
      await pool.query(
        `INSERT INTO user_stats (user_id, total_reviews_received)
         VALUES ($1, 1)
         ON CONFLICT (user_id) DO UPDATE
         SET total_reviews_received = user_stats.total_reviews_received + 1,
             updated_at = NOW()`,
        [opponent_id]
      );

      // Update average opponent rating
      const avgResult = await pool.query(
        `SELECT AVG(opponent_rating)::DECIMAL(3,2) as avg_rating
         FROM game_reviews
         WHERE opponent_id = $1 AND opponent_rating IS NOT NULL`,
        [opponent_id]
      );

      await pool.query(
        `UPDATE user_stats
         SET average_opponent_rating = $1
         WHERE user_id = $2`,
        [avgResult.rows[0].avg_rating, opponent_id]
      );
    }

    // Award XP (15 points for writing a review)
    await awardXP(userId, 15, 'review_submission');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

/**
 * Get all reviews for a game
 * GET /game-reviews/:gameId
 */
export const getGameReviews = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;

    const result = await pool.query(
      `SELECT
        gr.*,
        u.name as reviewer_name,
        u.avatar as reviewer_avatar,
        o.name as opponent_name
       FROM game_reviews gr
       JOIN users u ON gr.reviewer_id = u.id
       LEFT JOIN users o ON gr.opponent_id = o.id
       WHERE gr.game_id = $1 AND gr.reported = FALSE
       ORDER BY gr.created_at DESC`,
      [gameId]
    );

    // Calculate summary statistics
    const avgOpponentRating = result.rows.reduce((sum, r) => sum + (r.opponent_rating || 0), 0) / result.rows.filter(r => r.opponent_rating).length || null;
    const avgGameQuality = result.rows.reduce((sum, r) => sum + (r.game_quality_rating || 0), 0) / result.rows.filter(r => r.game_quality_rating).length || null;

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        total: result.rows.length,
        summary: {
          avg_opponent_rating: avgOpponentRating ? Math.round(avgOpponentRating * 10) / 10 : null,
          avg_game_quality: avgGameQuality ? Math.round(avgGameQuality * 10) / 10 : null
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching game reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

/**
 * Get user's review summary (reviews they've received)
 * GET /game-reviews/user/:userId/summary
 */
export const getUserReviewSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_reviews,
        AVG(opponent_rating)::DECIMAL(3,2) as avg_rating,
        COUNT(*) FILTER (WHERE opponent_rating = 5) as five_star_count,
        COUNT(*) FILTER (WHERE opponent_rating = 4) as four_star_count,
        COUNT(*) FILTER (WHERE opponent_rating = 3) as three_star_count,
        COUNT(*) FILTER (WHERE opponent_rating = 2) as two_star_count,
        COUNT(*) FILTER (WHERE opponent_rating = 1) as one_star_count
       FROM game_reviews
       WHERE opponent_id = $1 AND opponent_rating IS NOT NULL`,
      [userId]
    );

    // Get badge counts
    const badgeCountsResult = await pool.query(
      `SELECT unnest(badges) as badge, COUNT(*) as count
       FROM game_reviews
       WHERE opponent_id = $1
       GROUP BY badge
       ORDER BY count DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        total_reviews: parseInt(result.rows[0].total_reviews),
        badge_counts: badgeCountsResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching user review summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review summary',
      error: error.message
    });
  }
};

/**
 * Get current user's review for a specific game
 * GET /game-reviews/:gameId/my-review
 */
export const getMyReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;

    const result = await pool.query(
      `SELECT * FROM game_reviews
       WHERE game_id = $1 AND reviewer_id = $2`,
      [gameId, userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No review found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching user review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message
    });
  }
};

/**
 * Delete a review (reviewer only)
 * DELETE /game-reviews/:gameId/my-review
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;

    const result = await pool.query(
      `DELETE FROM game_reviews
       WHERE game_id = $1 AND reviewer_id = $2
       RETURNING *`,
      [gameId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};
