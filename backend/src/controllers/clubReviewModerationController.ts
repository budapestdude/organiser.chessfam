import { Request, Response, NextFunction } from 'express';
import * as moderationService from '../services/clubReviewModerationService';
import { ValidationError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const flagReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { reviewId } = req.params;
    const { reason } = req.body;

    await moderationService.flagReview(parseInt(reviewId), req.user.userId, reason);

    sendSuccess(res, null, 'Review flagged successfully');
  } catch (error) {
    next(error);
  }
};

export const hideReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { reviewId } = req.params;

    await moderationService.hideReview(parseInt(reviewId), req.user.userId);

    sendSuccess(res, null, 'Review hidden successfully');
  } catch (error) {
    next(error);
  }
};

export const unhideReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { reviewId } = req.params;

    await moderationService.unhideReview(parseInt(reviewId), req.user.userId);

    sendSuccess(res, null, 'Review unhidden successfully');
  } catch (error) {
    next(error);
  }
};

export const clearFlag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { reviewId } = req.params;

    await moderationService.clearFlag(parseInt(reviewId), req.user.userId);

    sendSuccess(res, null, 'Flag cleared successfully');
  } catch (error) {
    next(error);
  }
};

export const getFlaggedReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id: clubId } = req.params;

    const reviews = await moderationService.getFlaggedReviews(parseInt(clubId), req.user.userId);

    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

export const getReviewsForModeration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id: clubId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await moderationService.getReviewsForModeration(
      parseInt(clubId),
      req.user.userId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.reviews,
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
