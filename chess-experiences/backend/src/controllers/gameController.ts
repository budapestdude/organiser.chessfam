import { Request, Response } from 'express';
import pool from '../config/database';
import { CreateGameRequest, GameWithDetails } from '../types/game';

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
      description
    }: CreateGameRequest = req.body;

    // Validate required fields
    if (!venue_name || !game_date || !game_time) {
      return res.status(400).json({
        success: false,
        message: 'Venue name, date, and time are required'
      });
    }

    // Insert game
    const result = await pool.query(
      `INSERT INTO games (
        creator_id, venue_name, venue_address, venue_lat, venue_lng,
        game_date, game_time, duration_minutes, time_control,
        player_level, max_players, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId, venue_name, venue_address, venue_lat, venue_lng,
        game_date, game_time, duration_minutes, time_control,
        player_level, max_players, description
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: result.rows[0]
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
    const { status = 'open', date_from, date_to, venue, player_level } = req.query;

    let query = `
      SELECT
        g.*,
        u.name as creator_name,
        u.rating as creator_rating,
        COUNT(DISTINCT gp.id) as participant_count
      FROM games g
      JOIN users u ON g.creator_id = u.id
      LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.status = 'confirmed'
      WHERE g.status = $1
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

    res.json({
      success: true,
      data: result.rows
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
      `SELECT * FROM game_participants WHERE game_id = $1 AND user_id = $2`,
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

    // Check if game is now full and update status
    const newCount = parseInt(game.participant_count) + 1;
    if (newCount >= game.max_players) {
      await pool.query(
        `UPDATE games SET status = 'full', updated_at = NOW() WHERE id = $1`,
        [id]
      );
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
      `SELECT * FROM game_participants WHERE game_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant of this game'
      });
    }

    // Remove participant
    await pool.query(
      `DELETE FROM game_participants WHERE game_id = $1 AND user_id = $2`,
      [id, userId]
    );

    // Update game status to open if it was full
    await pool.query(
      `UPDATE games SET status = 'open', updated_at = NOW() WHERE id = $1 AND status = 'full'`,
      [id]
    );

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

    // Check if user is the creator
    const gameResult = await pool.query(
      `SELECT * FROM games WHERE id = $1 AND creator_id = $2`,
      [id, userId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own games'
      });
    }

    // Update game status
    await pool.query(
      `UPDATE games SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Game cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel game'
    });
  }
};
