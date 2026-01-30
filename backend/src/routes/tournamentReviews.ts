import express from 'express';
import {
  submitTournamentReview,
  getTournamentReviews,
  getUserTournamentReview
} from '../controllers/tournamentReviewController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.post('/submit', authenticateToken, submitTournamentReview);
router.get('/user/:tournamentId', authenticateToken, getUserTournamentReview);

// Public route
router.get('/:tournamentId', getTournamentReviews);

export default router;
