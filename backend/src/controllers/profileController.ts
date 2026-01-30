import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profileService';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';

// Heartbeat endpoint to update user's online status
export const heartbeat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    await profileService.updateLastActive(req.user.userId);
    sendSuccess(res, { online: true });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const profile = await profileService.getProfile(req.user.userId);
    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const profile = await profileService.updateProfile(req.user.userId, req.body);
    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const viewerId = req.user?.userId;

    const profile = await profileService.getPublicProfile(parseInt(id), viewerId);
    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    await profileService.changePassword(req.user.userId, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const changeEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      throw new ValidationError('New email and password are required');
    }

    await profileService.changeEmail(req.user.userId, newEmail, password);
    sendSuccess(res, null, 'Email changed successfully');
  } catch (error) {
    next(error);
  }
};

export const searchPlayers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      q, location, country, min_rating, max_rating,
      looking_for_games, chess_title, page = '1', limit = '20'
    } = req.query;

    const { players, total } = await profileService.searchPlayers({
      query: q as string,
      location: location as string,
      country: country as string,
      min_rating: min_rating ? parseInt(min_rating as string) : undefined,
      max_rating: max_rating ? parseInt(max_rating as string) : undefined,
      looking_for_games: looking_for_games === 'true' ? true : looking_for_games === 'false' ? false : undefined,
      chess_title: chess_title as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    sendPaginatedSuccess(res, players, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error) {
    next(error);
  }
};
