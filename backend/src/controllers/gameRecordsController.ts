import { Request, Response } from 'express';
import pool from '../config/database';
import { updateUserStats, checkAchievements } from './achievementController';

/**
 * Submit game result
 * POST /games/:id/result
 */
export const submitGameResult = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const gameId = parseInt(req.params.id);
    const { result, winner_id, pgn_data, notes } = req.body;

    // Verify user is the creator
    const gameCheck = await pool.query(
      'SELECT creator_id FROM games WHERE id = $1',
      [gameId]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (gameCheck.rows[0].creator_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the game creator can submit results'
      });
    }

    // Validate result
    const validResults = ['white_win', 'black_win', 'draw'];
    if (result && !validResults.includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result. Must be white_win, black_win, or draw'
      });
    }

    // Update game
    const updateResult = await pool.query(
      `UPDATE games
       SET result = $1,
           winner_id = $2,
           pgn_data = $3,
           notes = $4,
           status = 'completed',
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [result, winner_id, pgn_data, notes, gameId]
    );

    // Update stats (triggers will handle this, but we can also manually update)
    await updateUserStats(userId, {
      total_games_completed: (await pool.query(
        'SELECT COALESCE(total_games_completed, 0) + 1 as count FROM user_stats WHERE user_id = $1',
        [userId]
      )).rows[0]?.count || 1
    });

    res.json({
      success: true,
      message: 'Game result submitted successfully',
      data: updateResult.rows[0]
    });
  } catch (error: any) {
    console.error('Error submitting game result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit game result',
      error: error.message
    });
  }
};

/**
 * Upload PGN for game
 * POST /games/:id/pgn
 */
export const uploadGamePGN = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const gameId = parseInt(req.params.id);
    const { pgn_content, white_player, black_player, result, date_played, event_name } = req.body;

    if (!pgn_content) {
      return res.status(400).json({
        success: false,
        message: 'PGN content is required'
      });
    }

    // Verify user is the creator or participant
    const accessCheck = await pool.query(
      `SELECT 1 FROM games WHERE id = $1 AND creator_id = $2
       UNION
       SELECT 1 FROM game_participants WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Count moves in PGN (simplified)
    const moveMatches = pgn_content.match(/\d+\./g);
    const moveCount = moveMatches ? moveMatches.length : 0;

    // Insert PGN upload record
    const pgnResult = await pool.query(
      `INSERT INTO pgn_uploads (
        user_id, game_id, pgn_content, move_count,
        white_player, black_player, result, date_played, event_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [userId, gameId, pgn_content, moveCount, white_player, black_player, result, date_played, event_name]
    );

    // Also update game with PGN data
    await pool.query(
      'UPDATE games SET pgn_data = $1, updated_at = NOW() WHERE id = $2',
      [pgn_content, gameId]
    );

    res.json({
      success: true,
      message: 'PGN uploaded successfully',
      data: pgnResult.rows[0]
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
 * Toggle game record privacy
 * PATCH /games/:id/privacy
 */
export const toggleGamePrivacy = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const gameId = parseInt(req.params.id);
    const { is_public } = req.body;

    // Verify user is the creator
    const gameCheck = await pool.query(
      'SELECT creator_id FROM games WHERE id = $1',
      [gameId]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (gameCheck.rows[0].creator_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the game creator can change privacy settings'
      });
    }

    const result = await pool.query(
      'UPDATE games SET is_record_public = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [is_public, gameId]
    );

    res.json({
      success: true,
      message: 'Privacy setting updated',
      data: { is_record_public: result.rows[0].is_record_public }
    });
  } catch (error: any) {
    console.error('Error updating privacy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy setting',
      error: error.message
    });
  }
};

/**
 * Get game record
 * GET /games/:id/record
 */
export const getGameRecord = async (req: Request, res: Response) => {
  try {
    const gameId = parseInt(req.params.id);
    const userId = (req as any).user?.userId; // Optional auth

    // Get game with creator info
    const gameResult = await pool.query(
      `SELECT g.*,
              u.name as creator_name,
              u.avatar as creator_avatar,
              w.name as winner_name
       FROM games g
       LEFT JOIN users u ON g.creator_id = u.id
       LEFT JOIN users w ON g.winner_id = w.id
       WHERE g.id = $1`,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const game = gameResult.rows[0];

    // Check privacy
    if (!game.is_record_public && (!userId || game.creator_id !== userId)) {
      return res.status(403).json({
        success: false,
        message: 'This game record is private'
      });
    }

    // Get participants
    const participants = await pool.query(
      `SELECT u.id, u.name, u.avatar, u.rating, gp.joined_at
       FROM game_participants gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.game_id = $1 AND gp.status = 'confirmed'`,
      [gameId]
    );

    // Get PGN uploads
    const pgns = await pool.query(
      `SELECT id, user_id, pgn_content, move_count, white_player, black_player,
              result, date_played, event_name, created_at
       FROM pgn_uploads
       WHERE game_id = $1
       ORDER BY created_at DESC`,
      [gameId]
    );

    res.json({
      success: true,
      data: {
        game,
        participants: participants.rows,
        pgn_uploads: pgns.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching game record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game record',
      error: error.message
    });
  }
};

/**
 * Submit tournament results
 * POST /tournaments/:id/results
 */
export const submitTournamentResults = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const tournamentId = parseInt(req.params.id);
    const { standings, final_standings_text } = req.body;

    // Verify user is the organizer
    const tournamentCheck = await pool.query(
      'SELECT organizer_id FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    if (tournamentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournamentCheck.rows[0].organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the tournament organizer can submit results'
      });
    }

    // Update tournament
    await pool.query(
      `UPDATE tournaments
       SET results_data = $1,
           final_standings = $2,
           status = 'completed',
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(standings), final_standings_text, tournamentId]
    );

    // Insert standings into tournament_standings table
    if (standings && Array.isArray(standings)) {
      for (const standing of standings) {
        await pool.query(
          `INSERT INTO tournament_standings (
            tournament_id, user_id, player_name, rank, score,
            wins, losses, draws, games_played, prize_won
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (tournament_id, user_id)
          DO UPDATE SET
            rank = EXCLUDED.rank,
            score = EXCLUDED.score,
            wins = EXCLUDED.wins,
            losses = EXCLUDED.losses,
            draws = EXCLUDED.draws,
            games_played = EXCLUDED.games_played,
            prize_won = EXCLUDED.prize_won,
            updated_at = NOW()`,
          [
            tournamentId,
            standing.user_id,
            standing.player_name,
            standing.rank,
            standing.score,
            standing.wins || 0,
            standing.losses || 0,
            standing.draws || 0,
            standing.games_played || 0,
            standing.prize_won || 0
          ]
        );
      }
    }

    res.json({
      success: true,
      message: 'Tournament results submitted successfully'
    });
  } catch (error: any) {
    console.error('Error submitting tournament results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit tournament results',
      error: error.message
    });
  }
};

/**
 * Toggle tournament record privacy
 * PATCH /tournaments/:id/privacy
 */
export const toggleTournamentPrivacy = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const tournamentId = parseInt(req.params.id);
    const { is_public } = req.body;

    // Verify user is the organizer
    const tournamentCheck = await pool.query(
      'SELECT organizer_id FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    if (tournamentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournamentCheck.rows[0].organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the tournament organizer can change privacy settings'
      });
    }

    const result = await pool.query(
      'UPDATE tournaments SET is_record_public = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [is_public, tournamentId]
    );

    res.json({
      success: true,
      message: 'Privacy setting updated',
      data: { is_record_public: result.rows[0].is_record_public }
    });
  } catch (error: any) {
    console.error('Error updating privacy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy setting',
      error: error.message
    });
  }
};

/**
 * Get tournament record
 * GET /tournaments/:id/record
 */
export const getTournamentRecord = async (req: Request, res: Response) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const userId = (req as any).user?.userId;

    // Get tournament with organizer info
    const tournamentResult = await pool.query(
      `SELECT t.*,
              u.name as organizer_name,
              u.avatar as organizer_avatar
       FROM tournaments t
       LEFT JOIN users u ON t.organizer_id = u.id
       WHERE t.id = $1`,
      [tournamentId]
    );

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const tournament = tournamentResult.rows[0];

    // Check privacy
    if (!tournament.is_record_public && (!userId || tournament.organizer_id !== userId)) {
      return res.status(403).json({
        success: false,
        message: 'This tournament record is private'
      });
    }

    // Get standings
    const standings = await pool.query(
      `SELECT ts.*, u.name, u.avatar
       FROM tournament_standings ts
       LEFT JOIN users u ON ts.user_id = u.id
       WHERE ts.tournament_id = $1
       ORDER BY ts.rank ASC`,
      [tournamentId]
    );

    // Get game results
    const games = await pool.query(
      `SELECT gr.*,
              w.name as white_player_name,
              b.name as black_player_name
       FROM game_results gr
       LEFT JOIN users w ON gr.white_player_id = w.id
       LEFT JOIN users b ON gr.black_player_id = b.id
       WHERE gr.tournament_id = $1
       ORDER BY gr.round_number, gr.id`,
      [tournamentId]
    );

    res.json({
      success: true,
      data: {
        tournament,
        standings: standings.rows,
        games: games.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching tournament record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament record',
      error: error.message
    });
  }
};
