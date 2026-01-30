import { Request, Response } from 'express';
import pool from '../config/database';
import { CreateGameRequest, GameWithDetails } from '../types/game';
import crypto from 'crypto';
import {
  notifyPlayerJoined,
  notifyPlayerLeft,
  notifyGameStatusChange,
  notifyGameUpdate
} from '../services/gameNotificationService';
import { requireVerification } from '../services/verificationService';
import { checkAndIncrementGameQuota } from '../services/subscriptionService';

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Create a new game listing
export const createGame = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = user.userId;

    // Require identity verification for creating games
    try {
      await requireVerification(userId);
    } catch (verificationError: any) {
      return res.status(403).json({
        success: false,
        message: 'Identity verification required',
        error: verificationError.message,
        verification_required: true,
      });
    }

    // Check subscription quota for game creation
    const quotaCheck = await checkAndIncrementGameQuota(userId);
    if (!quotaCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: 'Monthly game creation limit reached',
        error: 'Upgrade to Premium for unlimited game creation',
        upgrade_required: true,
        quota: {
          used: quotaCheck.limit,
          limit: quotaCheck.limit,
          remaining: 0,
          tier: quotaCheck.tier,
        },
      });
    }

    const {
      venue_name,
      venue_address,
      venue_lat,
      venue_lng,
      game_date,
      game_time,
      duration_minutes = 60,
      time_control,
      player_level,
      max_players = 1,
      description,
      is_private = false,
      is_recurring = false,
      recurrence_pattern,
      recurrence_day,
      recurrence_end_date,
      min_rating,
      max_rating
    }: CreateGameRequest = req.body;

    // Validate required fields
    if (!venue_name || !game_date || !game_time) {
      return res.status(400).json({
        success: false,
        message: 'Venue name, date, and time are required'
      });
    }

    // Generate invitation token for private games
    let invitation_token = null;
    if (is_private) {
      invitation_token = crypto.randomBytes(32).toString('hex');
    }

    // Insert game
    const result = await pool.query(
      `INSERT INTO games (
        creator_id, venue_name, venue_address, venue_lat, venue_lng,
        game_date, game_time, duration_minutes, time_control,
        player_level, max_players, description, is_private, invitation_token,
        is_recurring, recurrence_pattern, recurrence_day, recurrence_end_date,
        min_rating, max_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        userId, venue_name, venue_address, venue_lat, venue_lng,
        game_date, game_time, duration_minutes, time_control,
        player_level, max_players, description, is_private, invitation_token,
        is_recurring, recurrence_pattern, recurrence_day, recurrence_end_date,
        min_rating, max_rating
      ]
    );

    // Update user stats if recurring
    if (is_recurring) {
      await pool.query(
        `UPDATE user_stats
         SET total_recurring_games = total_recurring_games + 1
         WHERE user_id = $1`,
        [userId]
      );
    }

    // Update user stats if private
    if (is_private) {
      await pool.query(
        `UPDATE user_stats
         SET total_private_games = total_private_games + 1
         WHERE user_id = $1`,
        [userId]
      );
    }

    // Prepare response with invitation link if private
    const responseData = {
      ...result.rows[0],
      invitation_link: is_private
        ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/games/join/${invitation_token}`
        : null
    };

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: responseData
    });
  } catch (error: any) {
    console.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create game'
    });
  }
};

// Get all available games with filters
export const getGames = async (req: Request, res: Response) => {
  try {
    const {
      status = 'open',
      date_from,
      date_to,
      venue,
      player_level,
      lat,
      lng,
      radius_km
    } = req.query;

    let query = `
      SELECT
        g.*,
        u.name as creator_name,
        u.rating as creator_rating,
        COUNT(DISTINCT gp.id) as participant_count
      FROM games g
      JOIN users u ON g.creator_id = u.id
      LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.status = 'confirmed'
      WHERE g.status = $1 AND g.is_private = FALSE
    `;

    const params: any[] = [status];
    let paramIndex = 2;

    if (date_from) {
      query += ` AND g.game_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND g.game_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    if (venue) {
      query += ` AND g.venue_name ILIKE $${paramIndex}`;
      params.push(`%${venue}%`);
      paramIndex++;
    }

    if (player_level) {
      query += ` AND g.player_level = $${paramIndex}`;
      params.push(player_level);
      paramIndex++;
    }

    query += ` GROUP BY g.id, u.name, u.rating ORDER BY g.game_date ASC, g.game_time ASC`;

    const result = await pool.query(query, params);

    // Apply location-based filtering if coordinates provided
    let games = result.rows;
    if (lat && lng && radius_km) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const radiusKm = parseFloat(radius_km as string);

      games = games.filter(game => {
        if (!game.venue_lat || !game.venue_lng) return false;
        const distance = haversineDistance(userLat, userLng, game.venue_lat, game.venue_lng);
        return distance <= radiusKm;
      }).map(game => ({
        ...game,
        distance: haversineDistance(userLat, userLng, game.venue_lat, game.venue_lng)
      }));

      // Sort by distance if location filtering applied
      games.sort((a, b) => a.distance - b.distance);
    }

    res.json({
      success: true,
      data: games
    });
  } catch (error: any) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch games'
    });
  }
};

// Get a single game by ID with full details
export const getGameById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get game details
    const gameResult = await pool.query(
      `SELECT
        g.*,
        u.name as creator_name,
        u.rating as creator_rating,
        u.avatar as creator_avatar
      FROM games g
      JOIN users u ON g.creator_id = u.id
      WHERE g.id = $1`,
      [id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Get participants
    const participantsResult = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.rating,
        u.avatar,
        gp.joined_at,
        gp.status
      FROM game_participants gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.game_id = $1 AND gp.status = 'confirmed'
      ORDER BY gp.joined_at ASC`,
      [id]
    );

    const game: GameWithDetails = {
      ...gameResult.rows[0],
      participant_count: participantsResult.rows.length,
      participants: participantsResult.rows
    };

    res.json({
      success: true,
      data: game
    });
  } catch (error: any) {
    console.error('Error fetching game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch game'
    });
  }
};

// Join a game
export const joinGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Require identity verification for joining games
    try {
      await requireVerification(userId);
    } catch (verificationError: any) {
      return res.status(403).json({
        success: false,
        message: 'Identity verification required',
        error: verificationError.message,
        verification_required: true,
      });
    }

    // Check if game exists and is open
    const gameResult = await pool.query(
      `SELECT g.*, COUNT(gp.id) as participant_count
       FROM games g
       LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.status = 'confirmed'
       WHERE g.id = $1
       GROUP BY g.id`,
      [id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const game = gameResult.rows[0];

    if (game.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This game is not open for joining'
      });
    }

    if (game.creator_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot join your own game'
      });
    }

    if (parseInt(game.participant_count) >= game.max_players) {
      return res.status(400).json({
        success: false,
        message: 'This game is already full'
      });
    }

    // Check if user already joined
    const existingParticipant = await pool.query(
      `SELECT id, game_id, user_id, joined_at, status FROM game_participants WHERE game_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existingParticipant.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this game'
      });
    }

    // Add participant
    await pool.query(
      `INSERT INTO game_participants (game_id, user_id)
       VALUES ($1, $2)`,
      [id, userId]
    );

    // Get user details for notification
    const userResult = await pool.query(
      `SELECT id, name, rating, avatar FROM users WHERE id = $1`,
      [userId]
    );

    const userDetails = userResult.rows[0];

    // Emit real-time notification
    notifyPlayerJoined(parseInt(id), userDetails);

    // Check if game is now full and update status
    const newCount = parseInt(game.participant_count) + 1;
    if (newCount >= game.max_players) {
      await pool.query(
        `UPDATE games SET status = 'full', updated_at = NOW() WHERE id = $1`,
        [id]
      );

      // Notify status change
      notifyGameStatusChange(parseInt(id), 'full', 'open');
    }

    res.json({
      success: true,
      message: 'Successfully joined the game'
    });
  } catch (error: any) {
    console.error('Error joining game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to join game'
    });
  }
};

// Leave a game
export const leaveGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Check if user is a participant
    const participantResult = await pool.query(
      `SELECT id, game_id, user_id FROM game_participants WHERE game_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant of this game'
      });
    }

    // Get user name for notification
    const userResult = await pool.query(
      `SELECT name FROM users WHERE id = $1`,
      [userId]
    );
    const userName = userResult.rows[0]?.name;

    // Get game status before removal
    const gameResult = await pool.query(
      `SELECT status FROM games WHERE id = $1`,
      [id]
    );
    const previousStatus = gameResult.rows[0]?.status;

    // Remove participant
    await pool.query(
      `DELETE FROM game_participants WHERE game_id = $1 AND user_id = $2`,
      [id, userId]
    );

    // Emit real-time notification
    notifyPlayerLeft(parseInt(id), userId, userName);

    // Update game status to open if it was full
    const wasFullResult = await pool.query(
      `UPDATE games SET status = 'open', updated_at = NOW() WHERE id = $1 AND status = 'full' RETURNING *`,
      [id]
    );

    if (wasFullResult.rows.length > 0) {
      // Game was full, now has a spot - notify status change
      notifyGameStatusChange(parseInt(id), 'open', previousStatus);

      // Check if there's a waitlist and notify first person
      const waitlistResult = await pool.query(
        `SELECT gw.user_id, u.email, u.name
         FROM game_waitlist gw
         JOIN users u ON gw.user_id = u.id
         WHERE gw.game_id = $1 AND gw.status = 'waiting'
         ORDER BY gw.joined_at ASC
         LIMIT 1`,
        [id]
      );

      if (waitlistResult.rows.length > 0) {
        const waitlistUser = waitlistResult.rows[0];

        // Import and call email service
        const { sendSpotAvailableEmail } = await import('../services/schedulerService');
        await sendSpotAvailableEmail(waitlistUser.email, waitlistUser.name, parseInt(id));

        // Update waitlist entry
        await pool.query(
          `UPDATE game_waitlist SET notified = TRUE WHERE game_id = $1 AND user_id = $2`,
          [id, waitlistUser.user_id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Successfully left the game'
    });
  } catch (error: any) {
    console.error('Error leaving game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to leave game'
    });
  }
};

// Get user's created games
export const getMyGames = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT
        g.*,
        COUNT(DISTINCT gp.id) as participant_count
      FROM games g
      LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.status = 'confirmed'
      WHERE g.creator_id = $1
      GROUP BY g.id
      ORDER BY g.game_date DESC, g.game_time DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching user games:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch your games'
    });
  }
};

// Get games user has joined
export const getJoinedGames = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT
        g.*,
        u.name as creator_name,
        u.rating as creator_rating,
        COUNT(DISTINCT gp2.id) as participant_count
      FROM game_participants gp
      JOIN games g ON gp.game_id = g.id
      JOIN users u ON g.creator_id = u.id
      LEFT JOIN game_participants gp2 ON g.id = gp2.game_id AND gp2.status = 'confirmed'
      WHERE gp.user_id = $1 AND gp.status = 'confirmed'
      GROUP BY g.id, u.name, u.rating
      ORDER BY g.game_date ASC, g.game_time ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching joined games:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch joined games'
    });
  }
};

// Cancel a game (creator only)
export const cancelGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    console.log(`[CancelGame] User ${userId} attempting to cancel game ${id}`);

    // Check if user is the creator
    const gameResult = await pool.query(
      `SELECT id, creator_id, status FROM games WHERE id = $1 AND creator_id = $2`,
      [id, userId]
    );

    if (gameResult.rows.length === 0) {
      console.log(`[CancelGame] User ${userId} not authorized to cancel game ${id}`);
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own games'
      });
    }

    const previousStatus = gameResult.rows[0].status;
    console.log(`[CancelGame] Game ${id} current status: ${previousStatus}`);

    // Update game status
    try {
      await pool.query(
        `UPDATE games SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      console.log(`[CancelGame] Game ${id} status updated to cancelled`);
    } catch (dbError: any) {
      console.error(`[CancelGame] Database error updating game ${id}:`, dbError);
      throw dbError;
    }

    // Emit real-time notification (wrapped in try-catch to prevent notification failures from breaking the request)
    try {
      notifyGameStatusChange(parseInt(id), 'cancelled', previousStatus);
      console.log(`[CancelGame] Notification sent for game ${id}`);
    } catch (notifError: any) {
      console.error(`[CancelGame] Notification error for game ${id}:`, notifError);
      // Don't throw - notification failure shouldn't break the cancellation
    }

    res.json({
      success: true,
      message: 'Game cancelled successfully'
    });
  } catch (error: any) {
    console.error('[CancelGame] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel game',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Join a private game via invitation token
export const joinPrivateGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { token } = req.params;

    // Require identity verification for joining private games
    try {
      await requireVerification(userId);
    } catch (verificationError: any) {
      return res.status(403).json({
        success: false,
        message: 'Identity verification required',
        error: verificationError.message,
        verification_required: true,
      });
    }

    // Find game by invitation token
    const gameResult = await pool.query(
      `SELECT g.*, COUNT(gp.id) as participant_count
       FROM games g
       LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.status = 'confirmed'
       WHERE g.invitation_token = $1 AND g.is_private = TRUE
       GROUP BY g.id`,
      [token]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation link'
      });
    }

    const game = gameResult.rows[0];

    if (game.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This game has been cancelled'
      });
    }

    if (game.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This game has already been completed'
      });
    }

    if (game.creator_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot join your own game'
      });
    }

    if (parseInt(game.participant_count) >= game.max_players) {
      return res.status(400).json({
        success: false,
        message: 'This game is already full'
      });
    }

    // Check if user already joined
    const existingParticipant = await pool.query(
      `SELECT id FROM game_participants WHERE game_id = $1 AND user_id = $2`,
      [game.id, userId]
    );

    if (existingParticipant.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this game'
      });
    }

    // Add participant
    await pool.query(
      `INSERT INTO game_participants (game_id, user_id)
       VALUES ($1, $2)`,
      [game.id, userId]
    );

    // Get user details for notification
    const userResult = await pool.query(
      `SELECT id, name, rating, avatar FROM users WHERE id = $1`,
      [userId]
    );

    const userDetails = userResult.rows[0];

    // Emit real-time notification
    notifyPlayerJoined(game.id, userDetails);

    // Check if game is now full and update status
    const newCount = parseInt(game.participant_count) + 1;
    if (newCount >= game.max_players) {
      await pool.query(
        `UPDATE games SET status = 'full', updated_at = NOW() WHERE id = $1`,
        [game.id]
      );

      // Notify status change
      notifyGameStatusChange(game.id, 'full', 'open');
    }

    res.json({
      success: true,
      message: 'Successfully joined the private game',
      data: { gameId: game.id }
    });
  } catch (error: any) {
    console.error('Error joining private game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to join private game'
    });
  }
};

// Regenerate invitation link for a private game (creator only)
export const regenerateInviteLink = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Check if user is the creator
    const gameResult = await pool.query(
      `SELECT id, creator_id, is_private FROM games WHERE id = $1 AND creator_id = $2`,
      [id, userId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only regenerate invitation links for your own games'
      });
    }

    if (!gameResult.rows[0].is_private) {
      return res.status(400).json({
        success: false,
        message: 'This is not a private game'
      });
    }

    // Generate new invitation token
    const invitation_token = crypto.randomBytes(32).toString('hex');

    // Update game
    await pool.query(
      `UPDATE games SET invitation_token = $1, updated_at = NOW() WHERE id = $2`,
      [invitation_token, id]
    );

    const invitation_link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/games/join/${invitation_token}`;

    res.json({
      success: true,
      message: 'Invitation link regenerated successfully',
      data: {
        invitation_token,
        invitation_link
      }
    });
  } catch (error: any) {
    console.error('Error regenerating invite link:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to regenerate invitation link'
    });
  }
};

// Update/edit a game (creator only)
export const updateGame = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Check if user is the creator
    const gameResult = await pool.query(
      `SELECT * FROM games WHERE id = $1 AND creator_id = $2`,
      [id, userId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own games'
      });
    }

    const game = gameResult.rows[0];

    // Cannot edit completed or cancelled games
    if (game.status === 'completed' || game.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit ${game.status} games`
      });
    }

    const {
      venue_name,
      venue_address,
      venue_lat,
      venue_lng,
      game_date,
      game_time,
      duration_minutes,
      time_control,
      player_level,
      max_players,
      description,
      min_rating,
      max_rating
    } = req.body;

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (venue_name !== undefined) {
      updates.push(`venue_name = $${paramIndex}`);
      params.push(venue_name);
      paramIndex++;
    }

    if (venue_address !== undefined) {
      updates.push(`venue_address = $${paramIndex}`);
      params.push(venue_address);
      paramIndex++;
    }

    if (venue_lat !== undefined) {
      updates.push(`venue_lat = $${paramIndex}`);
      params.push(venue_lat);
      paramIndex++;
    }

    if (venue_lng !== undefined) {
      updates.push(`venue_lng = $${paramIndex}`);
      params.push(venue_lng);
      paramIndex++;
    }

    if (game_date !== undefined) {
      updates.push(`game_date = $${paramIndex}`);
      params.push(game_date);
      paramIndex++;
    }

    if (game_time !== undefined) {
      updates.push(`game_time = $${paramIndex}`);
      params.push(game_time);
      paramIndex++;
    }

    if (duration_minutes !== undefined) {
      updates.push(`duration_minutes = $${paramIndex}`);
      params.push(duration_minutes);
      paramIndex++;
    }

    if (time_control !== undefined) {
      updates.push(`time_control = $${paramIndex}`);
      params.push(time_control);
      paramIndex++;
    }

    if (player_level !== undefined) {
      updates.push(`player_level = $${paramIndex}`);
      params.push(player_level);
      paramIndex++;
    }

    if (max_players !== undefined) {
      updates.push(`max_players = $${paramIndex}`);
      params.push(max_players);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (min_rating !== undefined) {
      updates.push(`min_rating = $${paramIndex}`);
      params.push(min_rating);
      paramIndex++;
    }

    if (max_rating !== undefined) {
      updates.push(`max_rating = $${paramIndex}`);
      params.push(max_rating);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);

    // Add game ID to params
    params.push(id);

    const query = `UPDATE games SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, params);

    // Emit real-time notification
    notifyGameUpdate(parseInt(id), 'game:update', {
      game: result.rows[0],
      message: 'Game details have been updated'
    });

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update game'
    });
  }
};
