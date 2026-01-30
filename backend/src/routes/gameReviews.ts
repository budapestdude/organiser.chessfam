import express from 'express';
import {
  submitReview,
  getGameReviews,
  getUserReviewSummary,
  getMyReview,
  deleteReview
} from '../controllers/gameReviewController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Submit or update a review (requires authentication)
router.post('/:gameId/submit', authenticateToken, submitReview);

// Get all reviews for a game (public)
router.get('/:gameId', getGameReviews);

// Get current user's review for a game (requires authentication)
router.get('/:gameId/my-review', authenticateToken, getMyReview);

// Delete user's review (requires authentication)
router.delete('/:gameId/my-review', authenticateToken, deleteReview);

// Get user's review summary
router.get('/user/:userId/summary', getUserReviewSummary);

export default router;
