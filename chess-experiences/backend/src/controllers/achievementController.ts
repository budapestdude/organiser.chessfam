import { Request, Response } from 'express';
import pool from '../config/database';

// Get user's achievements
export const getUserAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query(
      `SELECT
        a.*,
        ua.progress,
        ua.unlocked_at,
        CASE
          WHEN ua.unlocked_at IS NOT NULL THEN true
          ELSE false
        END as unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      ORDER BY
        CASE a.tier
          WHEN 'bronze' THEN 1
          WHEN 'silver' THEN 2
          WHEN 'gold' THEN 3
          WHEN 'platinum' THEN 4
        END,
        a.category,
        a.requirement_value`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
};

// Get user stats
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get or create user stats
    let statsResult = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [userId]
    );

    if (statsResult.rows.length === 0) {
      // Create initial stats
      statsResult = await pool.query(
        `INSERT INTO user_stats (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
    }

    // Get unlocked achievements count
    const achievementsResult = await pool.query(
      `SELECT COUNT(*) as unlocked_count
       FROM user_achievements
       WHERE user_id = $1 AND unlocked_at IS NOT NULL`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...statsResult.rows[0],
        unlocked_achievements: parseInt(achievementsResult.rows[0].unlocked_count)
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats'
    });
  }
};

// Check and update achievements (internal helper function)
export const checkAchievements = async (userId: number, statType: string, newValue: number) => {
  try {
    // Map stat types to achievement categories
    const achievementMap: Record<string, string[]> = {
      total_checkins: ['first_checkin', 'checkin_5', 'checkin_25', 'checkin_100'],
      unique_venues_visited: ['venues_3', 'venues_10', 'venues_25'],
      total_games_created: ['game_create_1', 'game_create_10'],
      total_games_joined: ['game_join_5', 'game_join_25'],
      unique_players_met: ['players_5', 'players_20', 'players_50'],
      total_bookings_made: ['booking_1', 'booking_5'],
      consecutive_checkin_days: ['streak_3', 'streak_7', 'streak_30']
    };

    const relevantAchievements = achievementMap[statType] || [];

    for (const achievementKey of relevantAchievements) {
      // Get achievement details
      const achievementResult = await pool.query(
        'SELECT * FROM achievements WHERE achievement_key = $1',
        [achievementKey]
      );

      if (achievementResult.rows.length === 0) continue;

      const achievement = achievementResult.rows[0];

      // Check if user already has this achievement
      const userAchievementResult = await pool.query(
        'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
        [userId, achievement.id]
      );

      if (userAchievementResult.rows.length === 0) {
        // Create new achievement progress
        if (newValue >= achievement.requirement_value) {
          // Unlock immediately
          await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [userId, achievement.id, newValue]
          );
        } else {
          // Create with progress
          await pool.query(
            `INSERT INTO user_achievements (user_id, achievement_id, progress)
             VALUES ($1, $2, $3)`,
            [userId, achievement.id, newValue]
          );
        }
      } else {
        const userAchievement = userAchievementResult.rows[0];

        // Update progress if not already unlocked
        if (!userAchievement.unlocked_at) {
          if (newValue >= achievement.requirement_value) {
            // Unlock the achievement
            await pool.query(
              `UPDATE user_achievements
               SET progress = $1, unlocked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
               WHERE user_id = $2 AND achievement_id = $3`,
              [newValue, userId, achievement.id]
            );
          } else {
            // Update progress
            await pool.query(
              `UPDATE user_achievements
               SET progress = $1, updated_at = CURRENT_TIMESTAMP
               WHERE user_id = $2 AND achievement_id = $3`,
              [newValue, userId, achievement.id]
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};

// Update user stats helper function
export const updateUserStats = async (userId: number, updates: Record<string, any>) => {
  try {
    // Ensure user_stats entry exists
    await pool.query(
      `INSERT INTO user_stats (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Build update query
    const updateKeys = Object.keys(updates);
    const setClause = updateKeys.map((key, idx) => `${key} = $${idx + 2}`).join(', ');

    const query = `
      UPDATE user_stats
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;

    const values = [userId, ...updateKeys.map(key => updates[key])];
    const result = await pool.query(query, values);

    // Check achievements for each updated stat
    for (const [key, value] of Object.entries(updates)) {
      await checkAchievements(userId, key, value);
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};
