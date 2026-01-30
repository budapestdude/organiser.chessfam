import { Request, Response, NextFunction } from 'express';
import * as pairingsService from '../services/pairingsService';
import { sendSuccess, sendCreated } from '../utils/response';
import { ValidationError } from '../utils/errors';
import { query } from '../config/database';

/**
 * Generate pairings for the next round
 */
export const generateNextRound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tournamentId } = req.params;
    const { system } = req.body;

    const result = await pairingsService.generateAndSavePairings(
      parseInt(tournamentId),
      system || 'dutch'
    );

    // Update tournament current_round
    await query(
      'UPDATE tournaments SET current_round = $1, updated_at = NOW() WHERE id = $2',
      [result.roundNumber, tournamentId]
    );

    sendCreated(res, result, 'Pairings generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pairings for a specific round
 */
export const getRoundPairings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tournamentId, roundNumber } = req.params;

    const result = await query(
      `SELECT
        tg.*,
        wr.player_name as white_player_name,
        wr.player_rating as white_player_rating,
        wr.pairing_number as white_pairing_number,
        br.player_name as black_player_name,
        br.player_rating as black_player_rating,
        br.pairing_number as black_pairing_number
      FROM tournament_games tg
      JOIN tournament_registrations wr ON tg.white_player_id = wr.id
      JOIN tournament_registrations br ON tg.black_player_id = br.id
      WHERE tg.tournament_id = $1 AND tg.round_number = $2
      ORDER BY tg.board_number ASC`,
      [tournamentId, roundNumber]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all rounds for a tournament
 */
export const getAllRounds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tournamentId } = req.params;

    const result = await query(
      `SELECT
        round_number,
        COUNT(*) as total_games,
        SUM(CASE WHEN result = 'ongoing' THEN 1 ELSE 0 END) as ongoing_games,
        SUM(CASE WHEN result != 'ongoing' THEN 1 ELSE 0 END) as completed_games
      FROM tournament_games
      WHERE tournament_id = $1
      GROUP BY round_number
      ORDER BY round_number ASC`,
      [tournamentId]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit game result
 */
export const submitResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params;
    const { result, pgn } = req.body;

    if (!['white_win', 'black_win', 'draw', 'forfeit_white', 'forfeit_black'].includes(result)) {
      throw new ValidationError('Invalid result value');
    }

    await query(
      `UPDATE tournament_games
       SET result = $1, status = $2, pgn = $3, updated_at = NOW()
       WHERE id = $4`,
      [result, 'completed', pgn || null, gameId]
    );

    const updatedGame = await query(
      `SELECT
        tg.*,
        wr.player_name as white_player_name,
        br.player_name as black_player_name
      FROM tournament_games tg
      JOIN tournament_registrations wr ON tg.white_player_id = wr.id
      JOIN tournament_registrations br ON tg.black_player_id = br.id
      WHERE tg.id = $1`,
      [gameId]
    );

    sendSuccess(res, updatedGame.rows[0], 'Result submitted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get standings/crosstable
 */
export const getStandings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tournamentId } = req.params;

    const result = await query(
      `SELECT
        tr.id,
        tr.player_name,
        tr.player_rating,
        tr.pairing_number,
        COUNT(DISTINCT tg.round_number) as games_played,
        SUM(CASE
          WHEN (tg.white_player_id = tr.id AND tg.result = 'white_win') THEN 1
          WHEN (tg.black_player_id = tr.id AND tg.result = 'black_win') THEN 1
          WHEN (tg.white_player_id = tr.id AND tg.result = 'forfeit_black') THEN 1
          WHEN (tg.black_player_id = tr.id AND tg.result = 'forfeit_white') THEN 1
          ELSE 0
        END) as wins,
        SUM(CASE
          WHEN tg.result = 'draw' THEN 1
          ELSE 0
        END) as draws,
        SUM(CASE
          WHEN (tg.white_player_id = tr.id AND tg.result = 'black_win') THEN 1
          WHEN (tg.black_player_id = tr.id AND tg.result = 'white_win') THEN 1
          WHEN (tg.white_player_id = tr.id AND tg.result = 'forfeit_white') THEN 1
          WHEN (tg.black_player_id = tr.id AND tg.result = 'forfeit_black') THEN 1
          ELSE 0
        END) as losses,
        SUM(CASE
          WHEN (tg.white_player_id = tr.id AND tg.result = 'white_win') THEN 1.0
          WHEN (tg.black_player_id = tr.id AND tg.result = 'black_win') THEN 1.0
          WHEN (tg.white_player_id = tr.id AND tg.result = 'forfeit_black') THEN 1.0
          WHEN (tg.black_player_id = tr.id AND tg.result = 'forfeit_white') THEN 1.0
          WHEN tg.result = 'draw' THEN 0.5
          ELSE 0.0
        END) as score
      FROM tournament_registrations tr
      LEFT JOIN tournament_games tg ON
        (tg.white_player_id = tr.id OR tg.black_player_id = tr.id)
        AND tg.tournament_id = tr.tournament_id
        AND tg.result != 'ongoing'
      WHERE tr.tournament_id = $1 AND tr.status = 'registered'
      GROUP BY tr.id, tr.player_name, tr.player_rating, tr.pairing_number
      ORDER BY score DESC, player_rating DESC`,
      [tournamentId]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a round (and all its pairings)
 */
export const deleteRound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tournamentId, roundNumber } = req.params;

    // Check if any games in this round have been completed
    const gamesResult = await query(
      `SELECT COUNT(*) as completed FROM tournament_games
       WHERE tournament_id = $1 AND round_number = $2 AND result != 'ongoing'`,
      [tournamentId, roundNumber]
    );

    if (parseInt(gamesResult.rows[0].completed) > 0) {
      throw new ValidationError('Cannot delete a round with completed games. Please remove results first.');
    }

    // Delete the round
    await query(
      'DELETE FROM tournament_games WHERE tournament_id = $1 AND round_number = $2',
      [tournamentId, roundNumber]
    );

    // Update tournament current_round if needed
    const maxRoundResult = await query(
      'SELECT COALESCE(MAX(round_number), 0) as max_round FROM tournament_games WHERE tournament_id = $1',
      [tournamentId]
    );

    await query(
      'UPDATE tournaments SET current_round = $1, updated_at = NOW() WHERE id = $2',
      [maxRoundResult.rows[0].max_round, tournamentId]
    );

    sendSuccess(res, null, 'Round deleted successfully');
  } catch (error) {
    next(error);
  }
};
