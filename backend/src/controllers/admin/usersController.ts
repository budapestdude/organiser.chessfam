import { Request, Response, NextFunction } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  deleteUser,
} from '../../services/admin/usersAdminService';
import { ValidationError } from '../../utils/errors';

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string | undefined;
    const status = req.query.status as 'all' | 'verified' | 'unverified' | 'banned' | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
    const is_master = req.query.is_master === 'true' ? true : undefined;

    const result = await getUsers({ page, limit, search, status, sortBy, sortOrder, is_master });

    res.json({
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    if (!userId) throw new ValidationError('Invalid user ID');

    const user = await getUserById(userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    if (!userId) throw new ValidationError('Invalid user ID');

    const { name, rating, is_admin } = req.body;
    const user = await updateUser(userId, { name, rating, is_admin });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const banUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const userId = parseInt(req.params.id);
    if (!userId) throw new ValidationError('Invalid user ID');

    const { reason } = req.body;
    if (!reason) throw new ValidationError('Ban reason is required');

    const user = await banUser(userId, reason, adminId);
    res.json({ user, message: 'User banned successfully' });
  } catch (error) {
    next(error);
  }
};

export const unbanUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const userId = parseInt(req.params.id);
    if (!userId) throw new ValidationError('Invalid user ID');

    const user = await unbanUser(userId, adminId);
    res.json({ user, message: 'User unbanned successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteUserHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const userId = parseInt(req.params.id);
    if (!userId) throw new ValidationError('Invalid user ID');

    await deleteUser(userId, adminId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
