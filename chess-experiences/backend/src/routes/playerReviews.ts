import express from 'express';
import {
  submitPlayerReview,
  getPlayerReviews,
  getUserPlayerReview
} from '../controllers/playerReviewController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.post('/submit', authenticateToken, submitPlayerReview);
router.get('/user/:playerId', authenticateToken, getUserPlayerReview);

// Public route
router.get('/:playerId', getPlayerReviews);

export default router;
