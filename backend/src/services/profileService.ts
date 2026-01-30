import { query } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import bcrypt from 'bcrypt';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  rating: number;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  fide_id: string | null;
  lichess_username: string | null;
  chesscom_username: string | null;
  chess_title: string | null;
  peak_rating: number | null;
  preferred_time_control: string | null;
  looking_for_games: boolean;
  looking_for_students: boolean;
  looking_for_coach: boolean;
  profile_visibility: string;
  show_rating: boolean;
  show_email: boolean;
  is_master: boolean;
  favorite_player: string | null;
  favorite_tournament: string | null;
  favorite_opening: string | null;
  created_at: Date;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  location?: string;
  country?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  fide_id?: string;
  lichess_username?: string;
  chesscom_username?: string;
  chess_title?: string;
  rating?: number;
  peak_rating?: number;
  preferred_time_control?: string;
  looking_for_games?: boolean;
  looking_for_students?: boolean;
  looking_for_coach?: boolean;
  profile_visibility?: string;
  show_rating?: boolean;
  show_email?: boolean;
  favorite_player?: string;
  favorite_tournament?: string;
  favorite_opening?: string;
}

const validChessTitles = ['GM', 'IM', 'FM', 'NM', 'CM', 'WGM', 'WIM', 'WFM', 'WNM', 'WCM', 'AGM', 'AIM', 'AFM', null, ''];
const validTimeControls = ['bullet', 'blitz', 'rapid', 'classical', null, ''];
const validVisibility = ['public', 'members', 'private'];

export const getProfile = async (userId: number): Promise<UserProfile> => {
  // First try with all columns, fall back to basic columns if extended ones don't exist
  try {
    const result = await query(
      `SELECT id, name, email, rating, avatar, bio, location, country, phone, website,
              fide_id, lichess_username, chesscom_username, chess_title, peak_rating,
              preferred_time_control, looking_for_games, looking_for_students, looking_for_coach,
              profile_visibility, show_rating, show_email, is_master,
              favorite_player, favorite_tournament, favorite_opening, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  } catch (error: any) {
    // If column doesn't exist error (42703), fall back to minimal profile
    if (error.code === '42703') {
      console.log('Profile columns missing, using fallback query. Error:', error.message);
      try {
        // Try with just the essential columns that should always exist
        const result = await query(
          `SELECT id, name, email, COALESCE(rating, 1500) as rating, created_at
           FROM users WHERE id = $1`,
          [userId]
        );

        if (result.rows.length === 0) {
          throw new NotFoundError('User not found');
        }

        // Return with default values for all extended fields
        return {
          ...result.rows[0],
          avatar: null,
          bio: null,
          location: null,
          country: null,
          phone: null,
          website: null,
          fide_id: null,
          lichess_username: null,
          chesscom_username: null,
          chess_title: null,
          peak_rating: null,
          preferred_time_control: null,
          looking_for_games: true,
          looking_for_students: false,
          looking_for_coach: false,
          profile_visibility: 'public',
          show_rating: true,
          show_email: false,
          is_master: false,
          favorite_player: null,
          favorite_tournament: null,
          favorite_opening: null,
        };
      } catch (fallbackError: any) {
        console.error('Fallback query also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
    console.error('Profile query error:', error.message);
    throw error;
  }
};

export const getPublicProfile = async (userId: number, viewerId?: number): Promise<Partial<UserProfile>> => {
  const profile = await getProfile(userId);

  // If viewer is the user themselves, return full profile
  if (viewerId === userId) {
    return profile;
  }

  // Check visibility settings
  if (profile.profile_visibility === 'private' && viewerId !== userId) {
    return {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      chess_title: profile.chess_title,
    };
  }

  // Build public profile based on settings
  const publicProfile: Partial<UserProfile> = {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    bio: profile.bio,
    location: profile.location,
    country: profile.country,
    chess_title: profile.chess_title,
    fide_id: profile.fide_id,
    lichess_username: profile.lichess_username,
    chesscom_username: profile.chesscom_username,
    preferred_time_control: profile.preferred_time_control,
    looking_for_games: profile.looking_for_games,
    looking_for_students: profile.looking_for_students,
    looking_for_coach: profile.looking_for_coach,
    is_master: profile.is_master,
    favorite_player: profile.favorite_player,
    favorite_tournament: profile.favorite_tournament,
    favorite_opening: profile.favorite_opening,
    created_at: profile.created_at,
  };

  // Conditionally add rating
  if (profile.show_rating) {
    publicProfile.rating = profile.rating;
    publicProfile.peak_rating = profile.peak_rating;
  }

  // Conditionally add email
  if (profile.show_email) {
    publicProfile.email = profile.email;
  }

  // Add website if public
  if (profile.website) {
    publicProfile.website = profile.website;
  }

  return publicProfile;
};

export const updateProfile = async (
  userId: number,
  input: UpdateProfileInput
): Promise<UserProfile> => {
  // Validate chess title
  if (input.chess_title !== undefined && !validChessTitles.includes(input.chess_title)) {
    throw new ValidationError(`Invalid chess title. Must be one of: ${validChessTitles.filter(t => t).join(', ')}`);
  }

  // Validate time control
  if (input.preferred_time_control !== undefined && !validTimeControls.includes(input.preferred_time_control)) {
    throw new ValidationError('Invalid time control. Must be bullet, blitz, rapid, or classical');
  }

  // Validate visibility
  if (input.profile_visibility !== undefined && !validVisibility.includes(input.profile_visibility)) {
    throw new ValidationError('Invalid visibility. Must be public, members, or private');
  }

  // Validate rating if provided
  if (input.rating !== undefined && (input.rating < 100 || input.rating > 3500)) {
    throw new ValidationError('Rating must be between 100 and 3500');
  }

  // Validate name
  if (input.name !== undefined && input.name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'name', 'bio', 'location', 'country', 'phone', 'website', 'avatar',
    'fide_id', 'lichess_username', 'chesscom_username', 'chess_title',
    'rating', 'peak_rating', 'preferred_time_control',
    'looking_for_games', 'looking_for_students', 'looking_for_coach',
    'profile_visibility', 'show_rating', 'show_email',
    'favorite_player', 'favorite_tournament', 'favorite_opening'
  ];

  for (const field of allowedFields) {
    if (input[field as keyof UpdateProfileInput] !== undefined) {
      let value = input[field as keyof UpdateProfileInput];

      // Trim strings and convert empty strings to null for optional fields
      if (typeof value === 'string') {
        value = value.trim();
        if (value === '' && field !== 'name') {
          value = null;
        }
      }

      updates.push(`${field} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    return getProfile(userId);
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  try {
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return getProfile(userId);
  } catch (error: any) {
    // If column doesn't exist, try updating just name and rating
    if (error.code === '42703') {
      console.log('Some profile columns missing, updating only basic fields. Error:', error.message);

      const basicUpdates: string[] = [];
      const basicValues: any[] = [];
      let idx = 1;

      if (input.name) {
        basicUpdates.push(`name = $${idx++}`);
        basicValues.push(input.name.trim());
      }
      if (input.rating !== undefined) {
        basicUpdates.push(`rating = $${idx++}`);
        basicValues.push(input.rating);
      }

      if (basicUpdates.length > 0) {
        basicUpdates.push(`updated_at = NOW()`);
        basicValues.push(userId);

        await query(
          `UPDATE users SET ${basicUpdates.join(', ')} WHERE id = $${idx}`,
          basicValues
        );
      }

      return getProfile(userId);
    }
    throw error;
  }
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  // Get current password hash
  const result = await query(
    `SELECT password_hash FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isValid) {
    throw new ValidationError('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters');
  }

  // Hash and save new password
  const saltRounds = 12;
  const newHash = await bcrypt.hash(newPassword, saltRounds);

  await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newHash, userId]
  );
};

export const changeEmail = async (
  userId: number,
  newEmail: string,
  password: string
): Promise<void> => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    throw new ValidationError('Invalid email format');
  }

  // Get current password hash
  const result = await query(
    `SELECT password_hash FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, result.rows[0].password_hash);
  if (!isValid) {
    throw new ValidationError('Password is incorrect');
  }

  // Check if email is already taken
  const existing = await query(
    `SELECT id FROM users WHERE email = $1 AND id != $2`,
    [newEmail.toLowerCase(), userId]
  );

  if (existing.rows.length > 0) {
    throw new ValidationError('Email is already in use');
  }

  // Update email
  await query(
    `UPDATE users SET email = $1, email_verified = false, updated_at = NOW() WHERE id = $2`,
    [newEmail.toLowerCase(), userId]
  );
};

export const searchPlayers = async (filters: {
  query?: string;
  location?: string;
  country?: string;
  min_rating?: number;
  max_rating?: number;
  looking_for_games?: boolean;
  chess_title?: string;
  page?: number;
  limit?: number;
}): Promise<{ players: Partial<UserProfile>[]; total: number }> => {
  const {
    query: searchQuery, location, country, min_rating, max_rating,
    looking_for_games, chess_title, page = 1, limit = 20
  } = filters;
  const offset = (page - 1) * limit;

  let whereClause = `WHERE profile_visibility != 'private'`;
  const params: any[] = [];
  let paramIndex = 1;

  if (searchQuery) {
    whereClause += ` AND (LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(bio) LIKE LOWER($${paramIndex}))`;
    params.push(`%${searchQuery}%`);
    paramIndex++;
  }

  if (location) {
    whereClause += ` AND LOWER(location) LIKE LOWER($${paramIndex++})`;
    params.push(`%${location}%`);
  }

  if (country) {
    whereClause += ` AND LOWER(country) = LOWER($${paramIndex++})`;
    params.push(country);
  }

  if (min_rating) {
    whereClause += ` AND rating >= $${paramIndex++}`;
    params.push(min_rating);
  }

  if (max_rating) {
    whereClause += ` AND rating <= $${paramIndex++}`;
    params.push(max_rating);
  }

  if (looking_for_games !== undefined) {
    whereClause += ` AND looking_for_games = $${paramIndex++}`;
    params.push(looking_for_games);
  }

  if (chess_title) {
    whereClause += ` AND chess_title = $${paramIndex++}`;
    params.push(chess_title);
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT id, name, avatar, rating, location, country, chess_title, bio,
            looking_for_games, looking_for_students, looking_for_coach,
            preferred_time_control, show_rating, is_master,
            CASE WHEN last_active_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN true ELSE false END as online,
            last_active_at
     FROM users
     ${whereClause}
     ORDER BY rating DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  // Filter out ratings for users who don't want to show them
  const players = result.rows.map(player => {
    if (!player.show_rating) {
      delete player.rating;
    }
    delete player.show_rating;
    return player;
  });

  return { players, total };
};

// Update user's last active timestamp (heartbeat)
export const updateLastActive = async (userId: number): Promise<void> => {
  try {
    await query(
      `UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userId]
    );
  } catch (error: any) {
    // If column doesn't exist, silently ignore
    if (error.code !== '42703') {
      console.error('Error updating last_active_at:', error);
    }
  }
};
