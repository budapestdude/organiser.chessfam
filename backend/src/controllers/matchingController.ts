import { Request, Response } from 'express';
import { findMatchingGames, saveMatchPreferences, getMatchPreferences, findMatchingPlayers } from '../services/matchingService';
import pool from '../config/database';

/**
 * Get match suggestions for the current user
 * GET /matching/suggestions?lat&lng&max_distance&limit
 */
export const getMatchSuggestions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { lat, lng, max_distance, limit } = req.query;

    // Get user info
    const userResult = await pool.query(
      'SELECT rating FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user preferences (if they exist)
    const prefs = await getMatchPreferences(userId);

    // Build criteria
    const criteria = {
      userId,
      userRating: user.rating || 1200, // Default rating
      userLat: lat ? parseFloat(lat as string) : undefined,
      userLng: lng ? parseFloat(lng as string) : undefined,
      maxDistanceKm: max_distance ? parseInt(max_distance as string) : (prefs?.max_distance_km || 50),
      timeControls: prefs?.preferred_time_controls || [],
      playerLevels: prefs?.preferred_player_levels || [],
      preferredDays: prefs?.preferred_days || [],
      limit: limit ? parseInt(limit as string) : 20
    };

    const matches = await findMatchingGames(criteria);

    res.json({
      success: true,
      data: {
        matches,
        total: matches.length,
        criteria: {
          max_distance_km: criteria.maxDistanceKm,
          user_rating: criteria.userRating,
          has_location: !!(lat && lng)
        }
      }
    });
  } catch (error: any) {
    console.error('Error finding matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find match suggestions',
      error: error.message
    });
  }
};

/**
 * Update user's match preferences
 * PUT /matching/preferences
 */
export const updateMatchPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const preferences = req.body;

    // Validate preferences
    if (preferences.max_distance_km !== undefined) {
      const distance = parseInt(preferences.max_distance_km);
      if (isNaN(distance) || distance < 1 || distance > 500) {
        return res.status(400).json({
          success: false,
          message: 'max_distance_km must be between 1 and 500'
        });
      }
    }

    if (preferences.min_rating_diff !== undefined || preferences.max_rating_diff !== undefined) {
      const minDiff = preferences.min_rating_diff ?? -400;
      const maxDiff = preferences.max_rating_diff ?? 400;

      if (minDiff > maxDiff) {
        return res.status(400).json({
          success: false,
          message: 'min_rating_diff cannot be greater than max_rating_diff'
        });
      }
    }

    const savedPreferences = await saveMatchPreferences(userId, preferences);

    res.json({
      success: true,
      message: 'Match preferences updated successfully',
      data: savedPreferences
    });
  } catch (error: any) {
    console.error('Error updating match preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};

/**
 * Get user's match preferences
 * GET /matching/preferences
 */
export const getUserMatchPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const preferences = await getMatchPreferences(userId);

    res.json({
      success: true,
      data: preferences || {
        // Return defaults if no preferences set
        preferred_time_controls: [],
        preferred_player_levels: [],
        max_distance_km: 50,
        min_rating_diff: -400,
        max_rating_diff: 400,
        preferred_days: [],
        preferred_times: [],
        auto_match: false
      }
    });
  } catch (error: any) {
    console.error('Error fetching match preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
};

/**
 * Get matching players for direct invitations
 * GET /matching/players?lat&lng&limit
 */
export const getMatchingPlayers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { lat, lng, limit } = req.query;

    // Get user info
    const userResult = await pool.query(
      'SELECT rating FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const prefs = await getMatchPreferences(userId);

    const criteria = {
      userId,
      userRating: user.rating || 1200,
      userLat: lat ? parseFloat(lat as string) : undefined,
      userLng: lng ? parseFloat(lng as string) : undefined,
      maxDistanceKm: prefs?.max_distance_km || 50,
      limit: limit ? parseInt(limit as string) : 20
    };

    const players = await findMatchingPlayers(criteria);

    res.json({
      success: true,
      data: {
        players,
        total: players.length
      }
    });
  } catch (error: any) {
    console.error('Error finding matching players:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find matching players',
      error: error.message
    });
  }
};
