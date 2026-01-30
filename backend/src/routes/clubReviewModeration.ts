import express from 'express';
import * as moderationController from '../controllers/clubReviewModerationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Review moderation routes
router.post('/reviews/:reviewId/flag', authenticateToken, moderationController.flagReview);
router.post('/reviews/:reviewId/hide', authenticateToken, moderationController.hideReview);
router.post('/reviews/:reviewId/unhide', authenticateToken, moderationController.unhideReview);
router.post('/reviews/:reviewId/clear-flag', authenticateToken, moderationController.clearFlag);

// Get reviews for moderation
router.get('/clubs/:id/reviews/flagged', authenticateToken, moderationController.getFlaggedReviews);
router.get('/clubs/:id/reviews/moderate', authenticateToken, moderationController.getReviewsForModeration);

export default router;
