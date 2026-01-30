import { query } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  rating: number;
  avatar: string | null;
  is_admin: boolean;
  email_verified: boolean;
  is_banned: boolean;
  is_master: boolean;
  ban_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'verified' | 'unverified' | 'banned';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  is_master?: boolean;
}

export const getUsers = async (params: GetUsersParams = {}): Promise<{ users: AdminUser[]; total: number }> => {
  const {
    page = 1,
    limit = 50,
    search,
    status = 'all',
    sortBy = 'created_at',
    sortOrder = 'desc',
    is_master,
  } = params;

  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  const queryParams: (string | number | boolean)[] = [];
  let paramIndex = 1;

  // Search filter
  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  // Status filter
  if (status === 'verified') {
    whereConditions.push(`email_verified = true`);
  } else if (status === 'unverified') {
    whereConditions.push(`email_verified = false`);
  } else if (status === 'banned') {
    whereConditions.push(`is_banned = true`);
  }

  // Master filter
  if (is_master !== undefined) {
    whereConditions.push(`is_master = $${paramIndex}`);
    queryParams.push(is_master);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Validate sortBy to prevent SQL injection
  const allowedSortColumns = ['id', 'name', 'email', 'rating', 'created_at'];
  const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const [usersResult, countResult] = await Promise.all([
    query(
      `SELECT id, name, email, rating, avatar, is_admin,
              COALESCE(email_verified, false) as email_verified,
              COALESCE(is_banned, false) as is_banned,
              COALESCE(is_master, false) as is_master,
              chess_title,
              COALESCE(chess_title_verified, false) as chess_title_verified,
              ban_reason,
              created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY ${safeSort} ${safeSortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    ),
    query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      queryParams
    ),
  ]);

  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

export const getUserById = async (userId: number): Promise<AdminUser> => {
  const result = await query(
    `SELECT id, name, email, rating, avatar, is_admin,
            COALESCE(email_verified, false) as email_verified,
            COALESCE(is_banned, false) as is_banned,
            COALESCE(is_master, false) as is_master,
            ban_reason,
            created_at, updated_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  return result.rows[0];
};

export const updateUser = async (
  userId: number,
  updates: Partial<Pick<AdminUser, 'name' | 'rating' | 'is_admin' | 'is_master'>>
): Promise<AdminUser> => {
  const allowedFields = ['name', 'rating', 'is_admin', 'is_master'];
  const updateParts: string[] = [];
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateParts.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updateParts.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  updateParts.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query(
    `UPDATE users
     SET ${updateParts.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, email, rating, avatar, is_admin,
               COALESCE(email_verified, false) as email_verified,
               COALESCE(is_banned, false) as is_banned,
               COALESCE(is_master, false) as is_master,
               ban_reason, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  return result.rows[0];
};

export const banUser = async (userId: number, reason: string, adminId: number): Promise<AdminUser> => {
  // Prevent banning yourself
  if (userId === adminId) {
    throw new ValidationError('Cannot ban yourself');
  }

  // Check if user is an admin
  const userCheck = await query('SELECT is_admin FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  if (userCheck.rows[0].is_admin) {
    throw new ValidationError('Cannot ban an admin user');
  }

  const result = await query(
    `UPDATE users
     SET is_banned = true, ban_reason = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, rating, avatar, is_admin,
               COALESCE(email_verified, false) as email_verified,
               COALESCE(is_master, false) as is_master,
               is_banned, ban_reason, created_at, updated_at`,
    [reason, userId]
  );

  console.log(`[Admin] User ${userId} banned by admin ${adminId}. Reason: ${reason}`);

  return result.rows[0];
};

export const unbanUser = async (userId: number, adminId: number): Promise<AdminUser> => {
  const result = await query(
    `UPDATE users
     SET is_banned = false, ban_reason = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, rating, avatar, is_admin,
               COALESCE(email_verified, false) as email_verified,
               COALESCE(is_master, false) as is_master,
               is_banned, ban_reason, created_at, updated_at`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  console.log(`[Admin] User ${userId} unbanned by admin ${adminId}`);

  return result.rows[0];
};

export const deleteUser = async (userId: number, adminId: number): Promise<void> => {
  // Prevent deleting yourself
  if (userId === adminId) {
    throw new ValidationError('Cannot delete yourself');
  }

  // Check if user is an admin
  const userCheck = await query('SELECT is_admin FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  if (userCheck.rows[0].is_admin) {
    throw new ValidationError('Cannot delete an admin user');
  }

  await query('DELETE FROM users WHERE id = $1', [userId]);

  console.log(`[Admin] User ${userId} deleted by admin ${adminId}`);
};
