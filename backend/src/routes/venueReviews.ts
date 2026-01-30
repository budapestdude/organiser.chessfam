import express from 'express';
import {
  submitVenueReview,
  getVenueReviews,
  getUserVenueReview
} from '../controllers/venueReviewController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.post('/submit', authenticateToken, submitVenueReview);
router.get('/user/:venueId', authenticateToken, getUserVenueReview);

// Public route
router.get('/:venueId', getVenueReviews);

export default router;
