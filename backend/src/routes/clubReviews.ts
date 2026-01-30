import express from 'express';
import {
  submitClubReview,
  getClubReviews,
  getUserClubReview
} from '../controllers/clubReviewController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.post('/submit', authenticateToken, submitClubReview);
router.get('/user/:clubId', authenticateToken, getUserClubReview);

// Public route
router.get('/:clubId', getClubReviews);

export default router;
