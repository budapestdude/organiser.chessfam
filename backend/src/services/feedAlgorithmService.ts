import { query } from '../config/database';
import { NotFoundError } from '../utils/errors';

export interface AlgorithmSettings {
  weights: {
    likes: number;
    comments: number;
    recency: number;
    engagement: number;
  };
  boost_factors: {
    tournament_posts: number;
    pgn_posts: number;
    image_posts: number;
    verified_users: number;
  };
  time_decay: {
    half_life_hours: number;
    enabled: boolean;
  };
  filters: {
    min_content_length: number;
    hide_deleted: boolean;
    hide_flagged: boolean;
  };
}

export const getAllSettings = async (): Promise<Record<string, any>> => {
  try {
    const result = await query(
      `SELECT setting_key, setting_value, updated_at, updated_by
       FROM feed_algorithm_settings
       ORDER BY setting_key`
    );

    const settings: Record<string, any> = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.setting_value,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      };
    });

    return settings;
  } catch (error: any) {
    // If table doesn't exist yet, throw appropriate error
    if (error.code === '42P01') {
      throw new NotFoundError('Feed algorithm settings not initialized. Please contact administrator.');
    }
    throw error;
  }
};

export const getSetting = async (key: string): Promise<any> => {
  const result = await query(
    'SELECT setting_value FROM feed_algorithm_settings WHERE setting_key = $1',
    [key]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError(`Setting '${key}' not found`);
  }

  return result.rows[0].setting_value;
};

export const updateSetting = async (
  key: string,
  value: any,
  userId: number
): Promise<void> => {
  // Validate the setting exists
  const exists = await query(
    'SELECT id FROM feed_algorithm_settings WHERE setting_key = $1',
    [key]
  );

  if (exists.rows.length === 0) {
    throw new NotFoundError(`Setting '${key}' not found`);
  }

  // Update the setting
  await query(
    `UPDATE feed_algorithm_settings
     SET setting_value = $1, updated_at = NOW(), updated_by = $2
     WHERE setting_key = $3`,
    [JSON.stringify(value), userId, key]
  );
};

