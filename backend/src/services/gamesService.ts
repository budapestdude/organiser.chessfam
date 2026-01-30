import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

export interface Game {
  id: number;
  creator_id: number;
  title: string;
  description?: string;
  game_type: string;
  time_control?: string;
  status: string;
  max_players: number;
  current_players: number;
  rating_min?: number;
  rating_max?: number;
  scheduled_at?: Date;
  started_at?: Date;
  ended_at?: Date;
  winner_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface GameWithCreator extends Game {
  creator_name: string;
  creator_rating: number;
  creator_avatar?: string;
}

export interface CreateGameInput {
  title: string;
  description?: string;
  game_type?: string;
  time_control?: string;
  max_players?: number;
  rating_min?: number;
  rating_max?: number;
  scheduled_at?: Date;
}

export const getGames = async (filters: {
  status?: string;
  game_type?: string;
  creator_id?: number;
  page?: number;
  limit?: number;
}): Promise<{ games: GameWithCreator[]; total: number }> => {
  const { status, game_type, creator_id, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    whereClause += ` AND g.status = $${paramIndex++}`;
    params.push(status);
  }

  if (game_type) {
    whereClause += ` AND g.game_type = $${paramIndex++}`;
    params.push(game_type);
  }

  if (creator_id) {
    whereClause += ` AND g.creator_id = $${paramIndex++}`;
    params.push(creator_id);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM games g ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated games with creator info
  const result = await query(
    `SELECT g.*, u.name as creator_name, u.rating as creator_rating, u.avatar as creator_avatar
     FROM games g
     JOIN users u ON g.creator_id = u.id
     ${whereClause}
     ORDER BY g.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return { games: result.rows, total };
};

export const getGameById = async (id: number): Promise<GameWithCreator> => {
  const result = await query(
    `SELECT g.*, u.name as creator_name, u.rating as creator_rating, u.avatar as creator_avatar
     FROM games g
     JOIN users u ON g.creator_id = u.id
     WHERE g.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Game not found');
  }

  return result.rows[0];
};

export const createGame = async (
  creatorId: number,
  input: CreateGameInput
): Promise<Game> => {
  const {
    title,
    description,
    game_type = 'casual',
    time_control,
    max_players = 2,
    rating_min,
    rating_max,
    scheduled_at,
  } = input;

  if (!title || title.trim().length === 0) {
    throw new ValidationError('Game title is required');
  }

  const result = await query(
    `INSERT INTO games (creator_id, title, description, game_type, time_control, max_players, rating_min, rating_max, scheduled_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [creatorId, title.trim(), description, game_type, time_control, max_players, rating_min, rating_max, scheduled_at]
  );

  // Add creator as first participant
  await query(
    `INSERT INTO game_participants (game_id, user_id)
     VALUES ($1, $2)`,
    [result.rows[0].id, creatorId]
  );

  return result.rows[0];
};

export const joinGame = async (gameId: number, userId: number): Promise<void> => {
  const game = await getGameById(gameId);

  if (game.status !== 'open') {
    throw new ValidationError('Game is not open for joining');
  }

  if (game.current_players >= game.max_players) {
    throw new ValidationError('Game is full');
  }

  // Check if user is already in the game
  const existingParticipant = await query(
    `SELECT id FROM game_participants WHERE game_id = $1 AND user_id = $2`,
    [gameId, userId]
  );

  if (existingParticipant.rows.length > 0) {
    throw new ValidationError('You are already in this game');
  }

  // Check rating requirements
  if (game.rating_min || game.rating_max) {
    const userResult = await query(`SELECT rating FROM users WHERE id = $1`, [userId]);
    const userRating = userResult.rows[0]?.rating || 1500;

    if (game.rating_min && userRating < game.rating_min) {
      throw new ValidationError(`Your rating is below the minimum requirement (${game.rating_min})`);
    }
    if (game.rating_max && userRating > game.rating_max) {
      throw new ValidationError(`Your rating is above the maximum requirement (${game.rating_max})`);
    }
  }

  // Add participant and update player count
  await query(
    `INSERT INTO game_participants (game_id, user_id)
     VALUES ($1, $2)`,
    [gameId, userId]
  );

  const newPlayerCount = game.current_players + 1;
  const newStatus = newPlayerCount >= game.max_players ? 'in_progress' : 'open';

  await query(
    `UPDATE games SET current_players = $1, status = $2, updated_at = NOW() WHERE id = $3`,
    [newPlayerCount, newStatus, gameId]
  );
};

export const leaveGame = async (gameId: number, userId: number): Promise<void> => {
  const game = await getGameById(gameId);

  if (game.creator_id === userId) {
    throw new ValidationError('Game creator cannot leave. Cancel the game instead.');
  }

  if (game.status !== 'open') {
    throw new ValidationError('Cannot leave a game that has already started');
  }

  const result = await query(
    `DELETE FROM game_participants WHERE game_id = $1 AND user_id = $2 RETURNING id`,
    [gameId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('You are not in this game');
  }

  await query(
    `UPDATE games SET current_players = current_players - 1, updated_at = NOW() WHERE id = $1`,
    [gameId]
  );
};

export const cancelGame = async (gameId: number, userId: number): Promise<void> => {
  const game = await getGameById(gameId);

  if (game.creator_id !== userId) {
    throw new ForbiddenError('Only the game creator can cancel the game');
  }

  if (game.status === 'completed') {
    throw new ValidationError('Cannot cancel a completed game');
  }

  await query(
    `UPDATE games SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [gameId]
  );
};

export const getGameParticipants = async (gameId: number): Promise<any[]> => {
  const result = await query(
    `SELECT gp.*, u.name, u.rating, u.avatar
     FROM game_participants gp
     JOIN users u ON gp.user_id = u.id
     WHERE gp.game_id = $1
     ORDER BY gp.joined_at ASC`,
    [gameId]
  );

  return result.rows;
};

export const getUserGames = async (userId: number): Promise<GameWithCreator[]> => {
  const result = await query(
    `SELECT g.*, u.name as creator_name, u.rating as creator_rating, u.avatar as creator_avatar
     FROM games g
     JOIN users u ON g.creator_id = u.id
     WHERE g.id IN (SELECT game_id FROM game_participants WHERE user_id = $1)
     ORDER BY g.created_at DESC`,
    [userId]
  );

  return result.rows;
};
