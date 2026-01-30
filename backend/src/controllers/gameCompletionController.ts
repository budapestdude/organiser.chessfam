import { Request, Response } from 'express';
import pool from '../config/database';
import { notifyGameStatusChange } from '../services/gameNotificationService';

/**
 * Helper function to award XP and update level
 */
async function awardXP(userId: number, xp: number, reason: string) {
  const result = await pool.query(
    `UPDATE users
     SET xp = xp + $1,
         level = FLOOR((xp + $1) / 100) + 1
     WHERE id = $2
     RETURNING xp, level`,
    [xp, userId]
  );

  if (result.rows.length > 0) {
    console.log(`[XP] User ${userId} earned ${xp} XP for ${reason}. New total: ${result.rows[0].xp} (Level ${result.rows[0].level})`);
  }

  return result.rows[0];
}

/**
 * Helper function to check and update achievements
 */
async function checkAchievements(userId: number, statType: string, newValue?: number) {
  // This is a simplified version - full implementation would be in achievementController
  try {
    const achievementMap: Record<string, string[]> = {
      total_games_completed: ['game_complete_1', 'game_complete_10', 'game_complete_50', 'game_complete_100'],
      total_pgns_uploaded: ['pgn_upload_1', 'pgn_upload_10', 'pgn_upload_50'],
      total_reviews_given: ['review_5', 'review_25', 'review_100'],
      total_private_games: ['private_game_1', 'private_game_10'],
      total_recurring_games: ['recurring_game_1', 'recurring_game_5']
    };

    const achievementKeys = achievementMap[statType];
    if (!achievementKeys) return;

    // Get current stat value
    const statResult = await pool.query(
      `SELECT ${statType} FROM user_stats WHERE user_id = $1`,
      [userId]
    );

    const currentValue = newValue !== undefined ? newValue : (statResult.rows[0]?.[statType] || 0);

    // Check each achievement
    for (const achievementKey of achievementKeys) {
      const achievementResult = await pool.query(
        `SELECT a.id, a.requirement_value,
                ua.id as user_achievement_id, ua.unlocked_at
         FROM achievements a
         LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
         WHERE a.achievement_key = $2`,
        [userId, achievementKey]
      );

      if (achievementResult.rows.length > 0) {
        const achievement = achievementResult.rows[0];

        if (!achievement.unlocked_at && currentValue >= achievement.requirement_value) {
          // Unlock achievement
          await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, achievement_id) DO UPDATE
             SET progress = $3, unlocked_at = NOW(), updated_at = NOW()`,
            [userId, achievement.id, currentValue]
          );

          console.log(`[Achievements] User ${userId} unlocked: ${achievementKey}`);
        }
      }
    }
  } catch (error) {
    console.error('[Achievements] Error checking achievements:', error);
  }
}

/**
 * Complete a game and record results
 * POST /games/:id/complete
 */
export const completeGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { white_player_id, black_player_id, result } = req.body;

    // Validate result
    const validResults = ['white_win', 'black_win', 'draw', 'ongoing'];
    if (result && !validResults.includes(result)) {
      return res.status(400).json({
        success: false,
        message: `Invalid result. Must be one of: ${validResults.join(', ')}`
      });
    }

    // Verify ownership
    const gameResult = await pool.query(
      'SELECT * FROM games WHERE id = $1 AND creator_id = $2',
      [id, userId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only the game creator can mark it as completed'
      });
    }

    const game = gameResult.rows[0];

    // Prevent re-completion
    if (game.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Game is already marked as completed'
      });
    }

    // Update game
    const updateResult = await pool.query(
      `UPDATE games
       SET status = 'completed',
           completed_at = NOW(),
           white_player_id = $1,
           black_player_id = $2,
           result = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [white_player_id, black_player_id, result, id]
    );

    // Get all participants
    const participantsResult = await pool.query(
      `SELECT user_id FROM game_participants WHERE game_id = $1 AND status = 'confirmed'
       UNION SELECT creator_id FROM games WHERE id = $1`,
      [id]
    );

    // Update stats and award XP for all participants
    for (const participant of participantsResult.rows) {
      const participantId = participant.user_id || participant.creator_id;

      // Update stats
      await pool.query(
        `INSERT INTO user_stats (user_id, total_games_completed)
         VALUES ($1, 1)
         ON CONFLICT (user_id) DO UPDATE
         SET total_games_completed = user_stats.total_games_completed + 1,
             updated_at = NOW()`,
        [participantId]
      );

      // Award XP (50 points for completing a game)
      await awardXP(participantId, 50, 'game_completion');

      // Check achievements
      await checkAchievements(participantId, 'total_games_completed');
    }

    // Notify participants via Socket.IO
    notifyGameStatusChange(parseInt(id), 'completed', game.status);

    res.json({
      success: true,
      message: 'Game marked as completed successfully',
      data: updateResult.rows[0]
    });
  } catch (error: any) {
    console.error('Error completing game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete game',
      error: error.message
    });
  }
};

/**
 * Upload PGN for a completed game
 * POST /games/:gameId/pgn
 */
export const uploadPGN = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;
    const { pgn_data } = req.body;

    if (!pgn_data || typeof pgn_data !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'PGN data is required'
      });
    }

    // Verify game is completed
    const gameResult = await pool.query(
      'SELECT * FROM games WHERE id = $1 AND status = \'completed\'',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Game must be completed before uploading PGN'
      });
    }

    // Verify user was a participant
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
        message: 'Only game participants can upload PGN'
      });
    }

    // Parse PGN to extract metadata (simple parsing)
    const moveCount = (pgn_data.match(/\d+\./g) || []).length;
    const openingMatch = pgn_data.match(/\[Opening "(.+?)"\]/);
    const opening_name = openingMatch ? openingMatch[1] : null;

    // Insert or update PGN
    const result = await pool.query(
      `INSERT INTO game_pgn (game_id, uploaded_by, pgn_data, move_count, opening_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (game_id) DO UPDATE
       SET pgn_data = EXCLUDED.pgn_data,
           uploaded_by = EXCLUDED.uploaded_by,
           move_count = EXCLUDED.move_count,
           opening_name = EXCLUDED.opening_name,
           uploaded_at = NOW()
       RETURNING *`,
      [gameId, userId, pgn_data, moveCount, opening_name]
    );

    // Update stats
    await pool.query(
      `INSERT INTO user_stats (user_id, total_pgns_uploaded)
       VALUES ($1, 1)
       ON CONFLICT (user_id) DO UPDATE
       SET total_pgns_uploaded = user_stats.total_pgns_uploaded + 1,
           updated_at = NOW()`,
      [userId]
    );

    // Award XP (25 points for uploading PGN)
    await awardXP(userId, 25, 'pgn_upload');

    // Check achievements
    await checkAchievements(userId, 'total_pgns_uploaded');

    res.status(201).json({
      success: true,
      message: 'PGN uploaded successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error uploading PGN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload PGN',
      error: error.message
    });
  }
};

/**
 * Get PGN for a game
 * GET /games/:gameId/pgn
 */
export const getPGN = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;

    const result = await pool.query(
      `SELECT gp.*, u.name as uploaded_by_name
       FROM game_pgn gp
       JOIN users u ON gp.uploaded_by = u.id
       WHERE gp.game_id = $1`,
      [gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No PGN found for this game'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching PGN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PGN',
      error: error.message
    });
  }
};

/**
 * Delete PGN (uploader only)
 * DELETE /games/:gameId/pgn
 */
export const deletePGN = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { gameId } = req.params;

    const result = await pool.query(
      `DELETE FROM game_pgn
       WHERE game_id = $1 AND uploaded_by = $2
       RETURNING *`,
      [gameId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete PGN you uploaded'
      });
    }

    res.json({
      success: true,
      message: 'PGN deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting PGN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete PGN',
      error: error.message
    });
  }
};
