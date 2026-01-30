import { Request, Response } from 'express';
import pool from '../config/database';
import { generateAndSavePairings } from '../services/pairingsService';
import { pairingsAPI } from './pairingsController';

// Generate random chess player names
const firstNames = ['Magnus', 'Garry', 'Bobby', 'Anatoly', 'Mikhail', 'Vishwanathan', 'Vladimir', 'Fabiano', 'Hikaru', 'Levon', 'Wesley', 'Maxime', 'Anish', 'Sergey', 'Alexander', 'Veselin', 'Teimour', 'Shakhriyar', 'Pentala', 'Wang', 'Ding', 'Jan', 'Richard', 'Alireza', 'Nodirbek'];
const lastNames = ['Carlsen', 'Kasparov', 'Fischer', 'Karpov', 'Tal', 'Anand', 'Kramnik', 'Caruana', 'Nakamura', 'Aronian', 'So', 'Vachier-Lagrave', 'Giri', 'Karjakin', 'Grischuk', 'Topalov', 'Radjabov', 'Mamedyarov', 'Harikrishna', 'Hao', 'Liren', 'Nepomniachtchi', 'Rapport', 'Firouzja', 'Abdusattorov'];

function generateRandomName(): string {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function generateRandomRating(min: number = 1600, max: number = 2800): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Create a test tournament with mock participants
export async function createTestTournament(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const {
      playerCount = 16,
      rounds = 5,
      pairingSystem = 'dutch',
      tournamentName = 'Test Tournament'
    } = req.body;

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Validate player count
    if (playerCount < 4 || playerCount > 500) {
      return res.status(400).json({
        success: false,
        message: 'Player count must be between 4 and 500'
      });
    }

    await client.query('BEGIN');

    // Create tournament
    const tournamentResult = await client.query(
      `INSERT INTO tournaments (
        name, description, start_date, end_date, registration_deadline,
        max_participants, current_participants, entry_fee, currency,
        format, time_control, tournament_type, status, organizer_id,
        pairing_system, total_rounds, current_round
      ) VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days', NOW() + INTERVAL '1 day',
        $3, $4, 0, 'EUR', 'Swiss', 'Classical', 'Open', 'ongoing', $5, $6, $7, 0)
      RETURNING id`,
      [
        tournamentName,
        `Test tournament: ${playerCount} players, ${rounds} rounds, ${pairingSystem} system`,
        playerCount,
        playerCount,
        userId,
        pairingSystem,
        rounds
      ]
    );

    const tournamentId = tournamentResult.rows[0].id;

    // Create mock participants
    const participants = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < playerCount; i++) {
      let name = generateRandomName();
      let attempts = 0;

      // Ensure unique names
      while (usedNames.has(name) && attempts < 50) {
        name = generateRandomName();
        attempts++;
      }

      // If still not unique, add a number suffix
      if (usedNames.has(name)) {
        name = `${name} ${i + 1}`;
      }

      usedNames.add(name);
      const rating = generateRandomRating();

      const result = await client.query(
        `INSERT INTO tournament_registrations (
          tournament_id, user_id, player_name, player_email, player_rating,
          status, pairing_number, entry_fee
        ) VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, 0)
        RETURNING id, player_name, player_rating, pairing_number`,
        [tournamentId, userId, name, `player${i + 1}@test.com`, rating, i + 1]
      );

      participants.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        tournamentId,
        participants,
        rounds,
        pairingSystem
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating test tournament:', error);
    res.status(500).json({ success: false, message: 'Failed to create test tournament' });
  } finally {
    client.release();
  }
}

// Generate random game result
function generateRandomResult(): 'white_win' | 'black_win' | 'draw' {
  const rand = Math.random();
  if (rand < 0.40) return 'white_win';  // 40% white wins
  if (rand < 0.75) return 'draw';       // 35% draws
  return 'black_win';                   // 25% black wins
}

// Run automated tournament (all rounds with random results)
export async function runAutomatedTournament(req: Request, res: Response) {
  const { tournamentId } = req.params;
  const client = await pool.connect();

  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get tournament details
    const tournamentResult = await client.query(
      'SELECT total_rounds, pairing_system, current_round FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const { total_rounds, pairing_system } = tournamentResult.rows[0];
    const roundResults = [];

    console.log(`[AutoTournament] Running ${total_rounds} rounds for tournament ${tournamentId}`);

    // Run through all rounds
    for (let round = 1; round <= total_rounds; round++) {
      console.log(`[AutoTournament] Generating pairings for round ${round}/${total_rounds}`);

      // Generate pairings for this round
      const pairingResult = await generateAndSavePairings(
        parseInt(tournamentId),
        pairing_system
      );

      console.log(`[AutoTournament] Generated ${pairingResult.pairings.length} pairings for round ${pairingResult.roundNumber}`);

      // Get all games for this round
      const gamesResult = await client.query(
        `SELECT id, white_player_id, black_player_id
         FROM tournament_games
         WHERE tournament_id = $1 AND round_number = $2`,
        [tournamentId, round]
      );

      console.log(`[AutoTournament] Found ${gamesResult.rows.length} games for round ${round}`);

      // Submit random results for each game
      const gameResults = [];
      for (const game of gamesResult.rows) {
        const result = generateRandomResult();

        await client.query(
          `UPDATE tournament_games
           SET result = $1, status = 'completed', updated_at = NOW()
           WHERE id = $2`,
          [result, game.id]
        );

        gameResults.push({
          gameId: game.id,
          result
        });
      }

      console.log(`[AutoTournament] Completed round ${round} with ${gameResults.length} results`);

      roundResults.push({
        round,
        pairings: pairingResult.pairings.length,
        results: gameResults
      });
    }

    console.log(`[AutoTournament] Tournament complete! Ran ${roundResults.length} rounds`);

    // Get final standings
    const standingsResult = await client.query(
      `SELECT
        tr.id,
        tr.player_name,
        tr.player_rating,
        tr.pairing_number,
        COUNT(tg.id) FILTER (WHERE tg.white_player_id = tr.id OR tg.black_player_id = tr.id) as games_played,
        COUNT(tg.id) FILTER (WHERE
          (tg.white_player_id = tr.id AND tg.result = 'white_win') OR
          (tg.black_player_id = tr.id AND tg.result = 'black_win')
        ) as wins,
        COUNT(tg.id) FILTER (WHERE tg.result = 'draw') as draws,
        COUNT(tg.id) FILTER (WHERE
          (tg.white_player_id = tr.id AND tg.result = 'black_win') OR
          (tg.black_player_id = tr.id AND tg.result = 'white_win')
        ) as losses,
        (COUNT(tg.id) FILTER (WHERE
          (tg.white_player_id = tr.id AND tg.result = 'white_win') OR
          (tg.black_player_id = tr.id AND tg.result = 'black_win')
        ) +
        0.5 * COUNT(tg.id) FILTER (WHERE tg.result = 'draw')) as score
      FROM tournament_registrations tr
      LEFT JOIN tournament_games tg ON
        tg.tournament_id = tr.tournament_id AND
        (tg.white_player_id = tr.id OR tg.black_player_id = tr.id) AND
        tg.status = 'completed'
      WHERE tr.tournament_id = $1
      GROUP BY tr.id
      ORDER BY score DESC, tr.player_rating DESC`,
      [tournamentId]
    );

    res.json({
      success: true,
      data: {
        tournamentId: parseInt(tournamentId),
        totalRounds: total_rounds,
        roundResults,
        standings: standingsResult.rows
      }
    });
  } catch (error) {
    console.error('Error running automated tournament:', error);
    res.status(500).json({ success: false, message: 'Failed to run automated tournament' });
  } finally {
    client.release();
  }
}

// Run a single round with random results
export async function runSingleTestRound(req: Request, res: Response) {
  const { tournamentId } = req.params;
  const client = await pool.connect();

  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get tournament details
    const tournamentResult = await client.query(
      'SELECT pairing_system, current_round FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const { pairing_system, current_round } = tournamentResult.rows[0];

    // Generate pairings for next round
    const pairingResult = await generateAndSavePairings(
      parseInt(tournamentId),
      pairing_system
    );

    // Get all games for this round
    const gamesResult = await client.query(
      `SELECT id, white_player_id, black_player_id
       FROM tournament_games
       WHERE tournament_id = $1 AND round_number = $2`,
      [tournamentId, current_round + 1]
    );

    // Submit random results for each game
    const gameResults = [];
    for (const game of gamesResult.rows) {
      const result = generateRandomResult();

      await client.query(
        `UPDATE tournament_games
         SET result = $1, status = 'completed', updated_at = NOW()
         WHERE id = $2`,
        [result, game.id]
      );

      gameResults.push({
        gameId: game.id,
        whitePlayerId: game.white_player_id,
        blackPlayerId: game.black_player_id,
        result
      });
    }

    // Get updated standings
    const standingsResult = await client.query(
      `SELECT
        tr.id,
        tr.player_name,
        tr.player_rating,
        tr.pairing_number,
        COUNT(tg.id) FILTER (WHERE tg.white_player_id = tr.id OR tg.black_player_id = tr.id) as games_played,
        COUNT(tg.id) FILTER (WHERE
          (tg.white_player_id = tr.id AND tg.result = 'white_win') OR
          (tg.black_player_id = tr.id AND tg.result = 'black_win')
        ) as wins,
        COUNT(tg.id) FILTER (WHERE tg.result = 'draw') as draws,
        COUNT(tg.id) FILTER (WHERE
          (tg.white_player_id = tr.id AND tg.result = 'black_win') OR
          (tg.black_player_id = tr.id AND tg.result = 'white_win')
        ) as losses,
        (COUNT(tg.id) FILTER (WHERE
          (tg.white_player_id = tr.id AND tg.result = 'white_win') OR
          (tg.black_player_id = tr.id AND tg.result = 'black_win')
        ) +
        0.5 * COUNT(tg.id) FILTER (WHERE tg.result = 'draw')) as score
      FROM tournament_registrations tr
      LEFT JOIN tournament_games tg ON
        tg.tournament_id = tr.tournament_id AND
        (tg.white_player_id = tr.id OR tg.black_player_id = tr.id) AND
        tg.status = 'completed'
      WHERE tr.tournament_id = $1
      GROUP BY tr.id
      ORDER BY score DESC, tr.player_rating DESC`,
      [tournamentId]
    );

    res.json({
      success: true,
      data: {
        round: current_round + 1,
        pairings: pairingResult.pairings,
        results: gameResults,
        standings: standingsResult.rows
      }
    });
  } catch (error) {
    console.error('Error running test round:', error);
    res.status(500).json({ success: false, message: 'Failed to run test round' });
  } finally {
    client.release();
  }
}

// Withdraw a player from the tournament
export async function withdrawPlayer(req: Request, res: Response) {
  const { tournamentId, playerId } = req.params;
  const client = await pool.connect();

  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await client.query('BEGIN');

    // Check if player exists and is confirmed
    const playerCheck = await client.query(
      'SELECT * FROM tournament_registrations WHERE id = $1 AND tournament_id = $2',
      [playerId, tournamentId]
    );

    if (playerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    if (playerCheck.rows[0].status === 'withdrawn') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Player already withdrawn' });
    }

    // Mark player as withdrawn
    await client.query(
      `UPDATE tournament_registrations
       SET status = 'withdrawn', updated_at = NOW()
       WHERE id = $1`,
      [playerId]
    );

    // Get current round
    const tournamentResult = await client.query(
      'SELECT current_round FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    const currentRound = tournamentResult.rows[0].current_round;

    // Cancel any future games for this player
    await client.query(
      `UPDATE tournament_games
       SET status = 'cancelled', updated_at = NOW()
       WHERE tournament_id = $1
       AND round_number > $2
       AND (white_player_id = $3 OR black_player_id = $3)
       AND status = 'scheduled'`,
      [tournamentId, currentRound, playerId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Player withdrawn successfully',
      data: {
        playerId: parseInt(playerId),
        playerName: playerCheck.rows[0].player_name
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error withdrawing player:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw player' });
  } finally {
    client.release();
  }
}

// Request voluntary bye for a specific round
export async function requestVoluntaryBye(req: Request, res: Response) {
  const { tournamentId, playerId } = req.params;
  const { roundNumber } = req.body;
  const client = await pool.connect();

  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await client.query('BEGIN');

    // Check if player exists and is active
    const playerCheck = await client.query(
      `SELECT * FROM tournament_registrations
       WHERE id = $1 AND tournament_id = $2 AND status = 'confirmed'`,
      [playerId, tournamentId]
    );

    if (playerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Player not found or not active' });
    }

    // Check if pairing already exists for this round
    const existingGame = await client.query(
      `SELECT id FROM tournament_games
       WHERE tournament_id = $1 AND round_number = $2
       AND (white_player_id = $3 OR black_player_id = $3)`,
      [tournamentId, roundNumber, playerId]
    );

    if (existingGame.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Pairing already exists for this round. Cannot request bye.'
      });
    }

    // Create a bye game for this player
    await client.query(
      `INSERT INTO tournament_games (
        tournament_id, round_number, board_number,
        white_player_id, black_player_id,
        result, status
      ) VALUES ($1, $2, 999, $3, $3, 'white_win', 'completed')`,
      [tournamentId, roundNumber, playerId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Voluntary bye granted',
      data: {
        playerId: parseInt(playerId),
        playerName: playerCheck.rows[0].player_name,
        round: roundNumber
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error requesting voluntary bye:', error);
    res.status(500).json({ success: false, message: 'Failed to request voluntary bye' });
  } finally {
    client.release();
  }
}

// Get tournament participants with their status
export async function getTournamentParticipants(req: Request, res: Response) {
  const { tournamentId } = req.params;

  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT
        tr.id,
        tr.player_name,
        tr.player_rating,
        tr.pairing_number,
        tr.status,
        COUNT(tg.id) FILTER (WHERE tg.white_player_id = tr.id OR tg.black_player_id = tr.id) as games_played,
        COUNT(tg.id) FILTER (WHERE
          (tg.white_player_id = tr.id AND tg.result = 'white_win') OR
          (tg.black_player_id = tr.id AND tg.result = 'black_win')
        ) as wins,
        COUNT(tg.id) FILTER (WHERE tg.result = 'draw') as draws,
        (COUNT(tg.id) FILTER (WHERE
          (tg.white_player_id = tr.id AND tg.result = 'white_win') OR
          (tg.black_player_id = tr.id AND tg.result = 'black_win')
        ) +
        0.5 * COUNT(tg.id) FILTER (WHERE tg.result = 'draw')) as score
      FROM tournament_registrations tr
      LEFT JOIN tournament_games tg ON
        tg.tournament_id = tr.tournament_id AND
        (tg.white_player_id = tr.id OR tg.black_player_id = tr.id) AND
        tg.status = 'completed'
      WHERE tr.tournament_id = $1
      GROUP BY tr.id
      ORDER BY tr.status DESC, score DESC, tr.player_rating DESC`,
      [tournamentId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({ success: false, message: 'Failed to get participants' });
  }
}

// Simulate random withdrawals
export async function simulateRandomWithdrawals(req: Request, res: Response) {
  const { tournamentId } = req.params;
  const { withdrawalCount = 1 } = req.body;
  const client = await pool.connect();

  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await client.query('BEGIN');

    // Get active players
    const activePlayers = await client.query(
      `SELECT id, player_name FROM tournament_registrations
       WHERE tournament_id = $1 AND status = 'confirmed'
       ORDER BY RANDOM()
       LIMIT $2`,
      [tournamentId, withdrawalCount]
    );

    if (activePlayers.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'No active players to withdraw' });
    }

    const withdrawn = [];

    for (const player of activePlayers.rows) {
      // Mark player as withdrawn
      await client.query(
        `UPDATE tournament_registrations
         SET status = 'withdrawn', updated_at = NOW()
         WHERE id = $1`,
        [player.id]
      );

      // Get current round
      const tournamentResult = await client.query(
        'SELECT current_round FROM tournaments WHERE id = $1',
        [tournamentId]
      );

      const currentRound = tournamentResult.rows[0].current_round;

      // Cancel future games
      await client.query(
        `UPDATE tournament_games
         SET status = 'cancelled', updated_at = NOW()
         WHERE tournament_id = $1
         AND round_number > $2
         AND (white_player_id = $3 OR black_player_id = $3)
         AND status = 'scheduled'`,
        [tournamentId, currentRound, player.id]
      );

      withdrawn.push({
        playerId: player.id,
        playerName: player.player_name
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${withdrawn.length} player(s) withdrawn`,
      data: withdrawn
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error simulating withdrawals:', error);
    res.status(500).json({ success: false, message: 'Failed to simulate withdrawals' });
  } finally {
    client.release();
  }
}

// Delete test tournament
export async function deleteTestTournament(req: Request, res: Response) {
  const { tournamentId } = req.params;

  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await pool.query('DELETE FROM tournaments WHERE id = $1 AND organizer_id = $2', [tournamentId, userId]);

    res.json({ success: true, message: 'Test tournament deleted' });
  } catch (error) {
    console.error('Error deleting test tournament:', error);
    res.status(500).json({ success: false, message: 'Failed to delete test tournament' });
  }
}
