import pool from '../config/database';

// Haversine formula to calculate distance between two coordinates in km
// Reused from communitiesService.ts
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface MatchCriteria {
  userId: number;
  userRating: number;
  userLat?: number;
  userLng?: number;
  maxDistanceKm?: number;
  ratingRange?: { min: number; max: number };
  timeControls?: string[];
  playerLevels?: string[];
  preferredDays?: string[];
  limit?: number;
}

interface GameMatch {
  game_id: number;
  score: number; // match quality score 0-200
  distance_km?: number;
  rating_diff: number;
  matching_factors: string[];
  // Game details
  venue_name?: string;
  venue_address?: string;
  venue_lat?: number;
  venue_lng?: number;
  game_date?: string;
  game_time?: string;
  time_control?: string;
  player_level?: string;
  max_players?: number;
  description?: string;
  creator_name?: string;
  creator_rating?: number;
  participant_count?: number;
}

/**
 * Find matching games based on user preferences and criteria
 * Returns games scored 0-200 based on compatibility
 */
export const findMatchingGames = async (criteria: MatchCriteria): Promise<GameMatch[]> => {
  const {
    userId,
    userRating,
    userLat,
    userLng,
    maxDistanceKm = 50,
    ratingRange,
    timeControls = [],
    playerLevels = [],
    limit = 20
  } = criteria;

  // Build dynamic query based on criteria
  let queryText = `
    SELECT
      g.id as game_id,
      g.*,
      u.name as creator_name,
      u.rating as creator_rating,
      u.avatar as creator_avatar,
      COUNT(gp.id) as participant_count
    FROM games g
    JOIN users u ON g.creator_id = u.id
    LEFT JOIN game_participants gp ON g.id = gp.game_id AND gp.status = 'confirmed'
    WHERE g.status = 'open'
      AND g.creator_id != $1
      AND g.is_private = FALSE
      AND g.game_date >= CURRENT_DATE
  `;

  const params: any[] = [userId];
  let paramIndex = 2;

  // Rating filter (if game specifies rating requirements)
  queryText += ` AND (
    (g.min_rating IS NULL OR $${paramIndex} >= g.min_rating)
    AND (g.max_rating IS NULL OR $${paramIndex} <= g.max_rating)
  )`;
  params.push(userRating);
  paramIndex++;

  queryText += ` GROUP BY g.id, u.name, u.rating, u.avatar ORDER BY g.game_date ASC LIMIT $${paramIndex}`;
  params.push(limit * 3); // Fetch more for filtering
  paramIndex++;

  const result = await pool.query(queryText, params);
  const games = result.rows;

  // Score each game
  const matches: GameMatch[] = games.map(game => {
    let score = 100; // Base score
    const matchingFactors: string[] = [];

    // Rating compatibility (max 40 points)
    const ratingDiff = Math.abs(game.creator_rating - userRating);
    if (ratingDiff <= 100) {
      score += 40;
      matchingFactors.push('Very similar rating');
    } else if (ratingDiff <= 200) {
      score += 30;
      matchingFactors.push('Similar rating');
    } else if (ratingDiff <= 400) {
      score += 20;
      matchingFactors.push('Compatible rating');
    } else {
      score -= 20; // Penalty for large rating difference
    }

    // Location proximity (max 30 points)
    let distanceKm: number | undefined;
    if (userLat && userLng && game.venue_lat && game.venue_lng) {
      distanceKm = haversineDistance(userLat, userLng, game.venue_lat, game.venue_lng);
      if (distanceKm <= 5) {
        score += 30;
        matchingFactors.push('Very close (< 5km)');
      } else if (distanceKm <= 15) {
        score += 20;
        matchingFactors.push('Nearby (< 15km)');
      } else if (distanceKm <= maxDistanceKm) {
        score += 10;
        matchingFactors.push(`Within range (${distanceKm.toFixed(1)}km)`);
      } else {
        score -= 40; // Out of range penalty
      }
    }

    // Time control match (max 15 points)
    if (timeControls.length > 0 && game.time_control) {
      const matchesTimeControl = timeControls.some(tc =>
        game.time_control.toLowerCase().includes(tc.toLowerCase())
      );
      if (matchesTimeControl) {
        score += 15;
        matchingFactors.push('Preferred time control');
      }
    }

    // Player level match (max 15 points)
    if (playerLevels.length > 0 && game.player_level) {
      if (playerLevels.includes(game.player_level.toLowerCase())) {
        score += 15;
        matchingFactors.push('Matching skill level');
      }
    }

    // Bonus for games happening soon (max 10 points)
    const gameDate = new Date(game.game_date);
    const today = new Date();
    const daysUntilGame = Math.ceil((gameDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilGame <= 3) {
      score += 10;
      matchingFactors.push('Happening soon');
    } else if (daysUntilGame <= 7) {
      score += 5;
      matchingFactors.push('This week');
    }

    return {
      game_id: game.id,
      score,
      distance_km: distanceKm,
      rating_diff: ratingDiff,
      matching_factors: matchingFactors,
      // Include all game details
      venue_name: game.venue_name,
      venue_address: game.venue_address,
      venue_lat: game.venue_lat,
      venue_lng: game.venue_lng,
      game_date: game.game_date,
      game_time: game.game_time,
      time_control: game.time_control,
      player_level: game.player_level,
      max_players: game.max_players,
      description: game.description,
      creator_name: game.creator_name,
      creator_rating: game.creator_rating,
      participant_count: parseInt(game.participant_count) || 0
    };
  });

  // Filter by distance if coordinates provided, then sort by score
  let filteredMatches = matches;
  if (userLat && userLng) {
    filteredMatches = matches.filter(m =>
      !m.distance_km || m.distance_km <= maxDistanceKm
    );
  }

  return filteredMatches
    .filter(m => m.score > 40) // Minimum quality threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

/**
 * Save or update user's match preferences
 */
export const saveMatchPreferences = async (userId: number, preferences: any) => {
  const {
    preferred_time_controls,
    preferred_player_levels,
    max_distance_km,
    min_rating_diff,
    max_rating_diff,
    preferred_days,
    preferred_times,
    auto_match
  } = preferences;

  const result = await pool.query(
    `INSERT INTO match_preferences (
      user_id, preferred_time_controls, preferred_player_levels,
      max_distance_km, min_rating_diff, max_rating_diff,
      preferred_days, preferred_times, auto_match, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      preferred_time_controls = EXCLUDED.preferred_time_controls,
      preferred_player_levels = EXCLUDED.preferred_player_levels,
      max_distance_km = EXCLUDED.max_distance_km,
      min_rating_diff = EXCLUDED.min_rating_diff,
      max_rating_diff = EXCLUDED.max_rating_diff,
      preferred_days = EXCLUDED.preferred_days,
      preferred_times = EXCLUDED.preferred_times,
      auto_match = EXCLUDED.auto_match,
      updated_at = NOW()
    RETURNING *`,
    [
      userId,
      preferred_time_controls,
      preferred_player_levels,
      max_distance_km,
      min_rating_diff,
      max_rating_diff,
      preferred_days,
      preferred_times,
      auto_match
    ]
  );

  return result.rows[0];
};

/**
 * Get user's match preferences
 */
export const getMatchPreferences = async (userId: number) => {
  const result = await pool.query(
    'SELECT * FROM match_preferences WHERE user_id = $1',
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Find matching players (for direct invitations)
 * Similar to findMatchingGames but matches individual players instead
 */
export const findMatchingPlayers = async (criteria: MatchCriteria) => {
  const {
    userId,
    userRating,
    userLat,
    userLng,
    maxDistanceKm = 50,
    limit = 20
  } = criteria;

  // Find users with similar rating who have created games or have match preferences
  const result = await pool.query(
    `SELECT DISTINCT
      u.id,
      u.name,
      u.rating,
      u.avatar,
      u.level,
      us.total_games_created,
      us.total_games_joined,
      mp.preferred_time_controls,
      mp.preferred_player_levels,
      ABS(u.rating - $2) as rating_diff
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.user_id
    LEFT JOIN match_preferences mp ON u.id = mp.user_id
    WHERE u.id != $1
      AND u.rating BETWEEN $2 - 400 AND $2 + 400
    ORDER BY rating_diff ASC
    LIMIT $3`,
    [userId, userRating, limit]
  );

  return result.rows.map((player, index) => ({
    ...player,
    match_score: 100 - (player.rating_diff / 4), // Simple score based on rating
    rank: index + 1
  }));
};
