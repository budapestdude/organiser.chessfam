import { query } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface Favorite {
  id: number;
  user_id: number;
  item_type: string;
  item_id: number;
  created_at: Date;
}

export type ItemType = 'master' | 'venue' | 'club' | 'tournament' | 'player';

const validItemTypes: ItemType[] = ['master', 'venue', 'club', 'tournament', 'player'];

export const getFavorites = async (
  userId: number,
  itemType?: ItemType
): Promise<Favorite[]> => {
  let sql = `SELECT * FROM favorites WHERE user_id = $1`;
  const params: any[] = [userId];

  if (itemType) {
    sql += ` AND item_type = $2`;
    params.push(itemType);
  }

  sql += ` ORDER BY created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
};

export const getFavoritesWithDetails = async (
  userId: number,
  itemType?: ItemType
): Promise<any[]> => {
  // Get basic favorites first
  const favorites = await getFavorites(userId, itemType);

  // Enrich with item details based on type
  const enrichedFavorites = await Promise.all(
    favorites.map(async (fav) => {
      let itemDetails: any = null;

      switch (fav.item_type) {
        case 'venue':
          const venueResult = await query(
            `SELECT id, name, city, country, images, rating_avg FROM venues WHERE id = $1`,
            [fav.item_id]
          );
          itemDetails = venueResult.rows[0];
          break;
        case 'club':
          const clubResult = await query(
            `SELECT id, name, city, country, image, member_count FROM clubs WHERE id = $1`,
            [fav.item_id]
          );
          itemDetails = clubResult.rows[0];
          break;
        case 'tournament':
          const tournamentResult = await query(
            `SELECT id, name, start_date, status, image FROM tournaments WHERE id = $1`,
            [fav.item_id]
          );
          itemDetails = tournamentResult.rows[0];
          break;
        case 'player':
          const playerResult = await query(
            `SELECT id, name, rating, avatar FROM users WHERE id = $1`,
            [fav.item_id]
          );
          itemDetails = playerResult.rows[0];
          break;
        case 'master':
          const masterResult = await query(
            `SELECT id, name, title, rating, image FROM masters WHERE id = $1`,
            [fav.item_id]
          );
          itemDetails = masterResult.rows[0];
          break;
      }

      return {
        ...fav,
        item: itemDetails,
      };
    })
  );

  return enrichedFavorites.filter((f) => f.item !== null);
};

export const addFavorite = async (
  userId: number,
  itemType: ItemType,
  itemId: number
): Promise<Favorite> => {
  if (!validItemTypes.includes(itemType)) {
    throw new ValidationError(`Invalid item type. Must be one of: ${validItemTypes.join(', ')}`);
  }

  // Check if already favorited
  const existing = await query(
    `SELECT id FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
    [userId, itemType, itemId]
  );

  if (existing.rows.length > 0) {
    throw new ValidationError('Item is already in favorites');
  }

  // Verify item exists
  let tableName: string;
  switch (itemType) {
    case 'venue':
      tableName = 'venues';
      break;
    case 'club':
      tableName = 'clubs';
      break;
    case 'tournament':
      tableName = 'tournaments';
      break;
    case 'player':
      tableName = 'users';
      break;
    case 'master':
      tableName = 'masters';
      break;
    default:
      throw new ValidationError('Invalid item type');
  }

  const itemCheck = await query(`SELECT id FROM ${tableName} WHERE id = $1`, [itemId]);
  if (itemCheck.rows.length === 0) {
    throw new NotFoundError(`${itemType} not found`);
  }

  const result = await query(
    `INSERT INTO favorites (user_id, item_type, item_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, itemType, itemId]
  );

  return result.rows[0];
};

export const removeFavorite = async (
  userId: number,
  itemType: ItemType,
  itemId: number
): Promise<void> => {
  const result = await query(
    `DELETE FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3 RETURNING id`,
    [userId, itemType, itemId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Favorite not found');
  }
};

export const isFavorite = async (
  userId: number,
  itemType: ItemType,
  itemId: number
): Promise<boolean> => {
  const result = await query(
    `SELECT id FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
    [userId, itemType, itemId]
  );

  return result.rows.length > 0;
};

export const toggleFavorite = async (
  userId: number,
  itemType: ItemType,
  itemId: number
): Promise<{ isFavorite: boolean }> => {
  const exists = await isFavorite(userId, itemType, itemId);

  if (exists) {
    await removeFavorite(userId, itemType, itemId);
    return { isFavorite: false };
  } else {
    await addFavorite(userId, itemType, itemId);
    return { isFavorite: true };
  }
};

export const getFavoriteCount = async (
  itemType: ItemType,
  itemId: number
): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) FROM favorites WHERE item_type = $1 AND item_id = $2`,
    [itemType, itemId]
  );

  return parseInt(result.rows[0].count);
};
