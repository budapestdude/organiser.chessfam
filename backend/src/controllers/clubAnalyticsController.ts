import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/clubAnalyticsService';
import { ValidationError } from '../utils/errors';

export const getClubAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id: clubId } = req.params;
    const analytics = await analyticsService.getClubAnalytics(parseInt(clubId), req.user.userId);

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

export const getMemberDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id: clubId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await analyticsService.getMemberDetails(
      parseInt(clubId),
      req.user.userId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.members,
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
