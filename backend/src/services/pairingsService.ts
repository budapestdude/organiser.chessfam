import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { query } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

const execAsync = promisify(exec);

interface Player {
  id: number;
  user_id: number;
  player_name: string;
  player_rating: number;
  pairing_number?: number;
}

interface GameResult {
  round_number: number;
  white_player_id: number;
  black_player_id: number;
  result: 'white_win' | 'black_win' | 'draw' | 'ongoing' | 'forfeit_white' | 'forfeit_black';
}

interface Pairing {
  whitePlayerId: number;
  blackPlayerId: number;
  boardNumber: number;
}

/**
 * Convert tournament data to TRF format for bbpPairings
 */
export async function generateTRFFile(tournamentId: number, roundNumber: number): Promise<string> {
  // Get tournament info
  const tournamentResult = await query(
    'SELECT * FROM tournaments WHERE id = $1',
    [tournamentId]
  );

  if (tournamentResult.rows.length === 0) {
    throw new NotFoundError('Tournament not found');
  }

  const tournament = tournamentResult.rows[0];

  // Get all participants (confirmed or registered, exclude withdrawn)
  const participantsResult = await query(
    `SELECT
      id,
      user_id,
      player_name,
      player_rating,
      pairing_number
    FROM tournament_registrations
    WHERE tournament_id = $1 AND status IN ('confirmed', 'registered')
    ORDER BY pairing_number ASC, player_rating DESC`,
    [tournamentId]
  );

  const players: Player[] = participantsResult.rows;

  // Assign pairing numbers if not already assigned
  for (let i = 0; i < players.length; i++) {
    if (!players[i].pairing_number) {
      players[i].pairing_number = i + 1;
      await query(
        'UPDATE tournament_registrations SET pairing_number = $1 WHERE id = $2',
        [i + 1, players[i].id]
      );
    }
  }

  // Get all game results up to this round
  const gamesResult = await query(
    `SELECT
      round_number,
      white_player_id,
      black_player_id,
      result
    FROM tournament_games
    WHERE tournament_id = $1 AND round_number < $2
    ORDER BY round_number ASC`,
    [tournamentId, roundNumber]
  );

  const games: GameResult[] = gamesResult.rows;

  // Build TRF content
  let trf = '';

  // Header line (tournament name and date)
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  trf += `012 ${tournament.name.padEnd(80)} ${date}\n`;

  // Round info (XXR = number of rounds played so far)
  trf += `XXR ${Math.max(0, roundNumber - 1)}\n`;

  // Add each player
  for (const player of players) {
    const pairingNum = String(player.pairing_number).padStart(4, ' ');
    const name = player.player_name.padEnd(33);
    const rating = String(player.player_rating || 0).padStart(4, ' ');

    // Calculate score and build results string
    let score = 0;
    let resultsStr = '';

    // Group games by round for this player
    const playerGames: { [round: number]: GameResult } = {};
    games.forEach(game => {
      const isWhite = game.white_player_id === player.id;
      const isBlack = game.black_player_id === player.id;

      if (isWhite || isBlack) {
        playerGames[game.round_number] = game;

        // Calculate score
        if (game.result === 'white_win' && isWhite) score += 1;
        else if (game.result === 'black_win' && isBlack) score += 1;
        else if (game.result === 'draw') score += 0.5;
        else if (game.result === 'forfeit_white' && isBlack) score += 1;
        else if (game.result === 'forfeit_black' && isWhite) score += 1;
      }
    });

    // Build results string for each round
    for (let r = 1; r < roundNumber; r++) {
      const game = playerGames[r];
      if (game) {
        const isWhite = game.white_player_id === player.id;
        const opponentId = isWhite ? game.black_player_id : game.white_player_id;
        const opponent = players.find(p => p.id === opponentId);
        const opponentNum = String(opponent?.pairing_number || 0).padStart(4, ' ');
        const color = isWhite ? 'w' : 'b';

        let result = ' ';
        if (game.result === 'white_win') result = isWhite ? '1' : '0';
        else if (game.result === 'black_win') result = isWhite ? '0' : '1';
        else if (game.result === 'draw') result = '=';
        else if (game.result === 'forfeit_white') result = isWhite ? '-' : '+';
        else if (game.result === 'forfeit_black') result = isWhite ? '+' : '-';

        resultsStr += `  ${opponentNum} ${color} ${result}`;
      } else {
        // Bye or no game
        resultsStr += `     0 - -`;
      }
    }

    const scoreStr = score.toFixed(1).padStart(5, ' ');
    const rank = String(player.pairing_number).padStart(4, ' ');

    trf += `001 ${pairingNum}      ${name} ${rating}                      ${scoreStr} ${rank}${resultsStr}\n`;
  }

  return trf;
}

/**
 * Run bbpPairings executable and get pairings for the next round
 */
export async function generatePairings(
  tournamentId: number,
  roundNumber: number,
  system: 'dutch' | 'burstein' = 'dutch'
): Promise<Pairing[]> {
  // Generate TRF file
  const trfContent = await generateTRFFile(tournamentId, roundNumber);

  // Create temporary files in system temp directory
  const tempDir = path.join(os.tmpdir(), 'bbpPairings');
  await fs.mkdir(tempDir, { recursive: true });

  const inputFile = path.join(tempDir, `tournament_${tournamentId}_round_${roundNumber}.trf`);
  const outputFile = path.join(tempDir, `tournament_${tournamentId}_round_${roundNumber}_output.trf`);

  // Write TRF file
  await fs.writeFile(inputFile, trfContent);

  // Run bbpPairings (use environment variable or default path)
  const bbpPath = process.env.BBPPAIRINGS_PATH || path.join(__dirname, '../../bbpPairings/bbpPairings');
  console.log('[Pairings] Using bbpPairings at:', bbpPath);

  // Verify executable exists
  try {
    await fs.access(bbpPath, fs.constants.X_OK);
  } catch (error) {
    console.error('[Pairings] bbpPairings executable not found or not executable at:', bbpPath);
    throw new ValidationError(`bbpPairings executable not found at ${bbpPath}`);
  }

  const command = `"${bbpPath}" --${system} "${inputFile}" -p "${outputFile}"`;

  try {
    const { stdout, stderr } = await execAsync(command);
    console.log('[Pairings] bbpPairings output:', stdout);
    if (stderr) {
      console.error('[Pairings] bbpPairings stderr:', stderr);
    }
  } catch (error: any) {
    console.error('[Pairings] bbpPairings failed:', error);
    throw new ValidationError(`Failed to generate pairings: ${error.message}`);
  }

  // Read and parse output file
  const outputContent = await fs.readFile(outputFile, 'utf-8');
  const pairings = parseTRFPairings(outputContent, roundNumber);

  // Clean up temp files
  await fs.unlink(inputFile).catch(() => {});
  await fs.unlink(outputFile).catch(() => {});

  return pairings;
}

/**
 * Parse TRF output to extract pairings for the new round
 */
function parseTRFPairings(trfContent: string, roundNumber: number): Pairing[] {
  const lines = trfContent.split('\n');
  const pairings: Pairing[] = [];
  const playerMap = new Map<number, number>(); // pairing_number -> player_id

  // Parse player lines to build pairing number -> player_id map
  for (const line of lines) {
    if (line.startsWith('001')) {
      // Extract pairing number (columns 5-8)
      const pairingNum = parseInt(line.substring(4, 8).trim());

      // Parse results to find player_id from database
      // For now, we'll use pairing_number as a reference
      playerMap.set(pairingNum, pairingNum);
    }
  }

  // Parse pairings from the last round
  const roundPairings = new Map<number, { opponent: number; color: string }>();

  for (const line of lines) {
    if (line.startsWith('001')) {
      const pairingNum = parseInt(line.substring(4, 8).trim());

      // Find the result for the target round
      // Results start at position 90, each result takes 8 characters
      const resultsStart = 90;
      const resultIndex = roundNumber - 1;
      const resultPos = resultsStart + (resultIndex * 8);

      if (line.length > resultPos + 7) {
        const opponentStr = line.substring(resultPos + 2, resultPos + 6).trim();
        const color = line.substring(resultPos + 7, resultPos + 8);

        if (opponentStr && opponentStr !== '0' && color) {
          const opponent = parseInt(opponentStr);
          roundPairings.set(pairingNum, { opponent, color });
        }
      }
    }
  }

  // Convert to Pairing objects
  const paired = new Set<number>();
  let boardNumber = 1;

  for (const [pairingNum, { opponent, color }] of roundPairings.entries()) {
    if (!paired.has(pairingNum) && !paired.has(opponent)) {
      const whitePlayer = color === 'w' ? pairingNum : opponent;
      const blackPlayer = color === 'w' ? opponent : pairingNum;

      pairings.push({
        whitePlayerId: whitePlayer,
        blackPlayerId: blackPlayer,
        boardNumber: boardNumber++
      });

      paired.add(pairingNum);
      paired.add(opponent);
    }
  }

  return pairings;
}

/**
 * Save generated pairings to database
 */
export async function savePairings(
  tournamentId: number,
  roundNumber: number,
  pairings: Pairing[]
): Promise<void> {
  // Get player IDs from pairing numbers
  const registrationsResult = await query(
    'SELECT id, pairing_number FROM tournament_registrations WHERE tournament_id = $1',
    [tournamentId]
  );

  const pairingMap = new Map<number, number>();
  registrationsResult.rows.forEach(row => {
    pairingMap.set(row.pairing_number, row.id);
  });

  // Delete existing pairings for this round (if any)
  await query(
    'DELETE FROM tournament_games WHERE tournament_id = $1 AND round_number = $2',
    [tournamentId, roundNumber]
  );

  // Insert new pairings
  for (const pairing of pairings) {
    const whitePlayerId = pairingMap.get(pairing.whitePlayerId);
    const blackPlayerId = pairingMap.get(pairing.blackPlayerId);

    if (!whitePlayerId || !blackPlayerId) {
      console.error('[Pairings] Could not find player IDs for pairing:', pairing);
      continue;
    }

    await query(
      `INSERT INTO tournament_games
        (tournament_id, round_number, white_player_id, black_player_id, board_number, result, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tournamentId, roundNumber, whitePlayerId, blackPlayerId, pairing.boardNumber, 'ongoing', 'scheduled']
    );
  }
}

/**
 * Generate and save pairings for the next round
 */
export async function generateAndSavePairings(
  tournamentId: number,
  system: 'dutch' | 'burstein' = 'dutch'
): Promise<{ roundNumber: number; pairings: Pairing[] }> {
  // Get current round number
  const maxRoundResult = await query(
    'SELECT COALESCE(MAX(round_number), 0) as max_round FROM tournament_games WHERE tournament_id = $1',
    [tournamentId]
  );

  const currentRound = maxRoundResult.rows[0].max_round;
  const nextRound = currentRound + 1;

  // Generate pairings
  const pairings = await generatePairings(tournamentId, nextRound, system);

  // Save to database
  await savePairings(tournamentId, nextRound, pairings);

  return { roundNumber: nextRound, pairings };
}
