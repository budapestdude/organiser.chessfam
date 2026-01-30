import express from 'express';
import {
  sendChallenge,
  getReceivedChallenges,
  getSentChallenges,
  getPendingCount,
  respondToChallenge,
  cancelChallenge,
  getOpenChallenges
} from '../controllers/challengeController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes (no auth required)
// Get all open challenges (for the challenges board)
router.get('/open', getOpenChallenges);

// Protected routes (require authentication)
router.use(authenticateToken);

// Send a challenge
router.post('/', sendChallenge);

// Get challenges received by current user
router.get('/received', getReceivedChallenges);

// Get challenges sent by current user
router.get('/sent', getSentChallenges);

// Get pending challenge count (for notification badge)
router.get('/pending/count', getPendingCount);

// Respond to a challenge (accept/decline)
router.post('/:challengeId/respond', respondToChallenge);

// Cancel a sent challenge
router.post('/:challengeId/cancel', cancelChallenge);

export default router;
