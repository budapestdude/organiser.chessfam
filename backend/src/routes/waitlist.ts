import express from 'express';
import {
  joinWaitlist,
  leaveWaitlist,
  getWaitlistStatus,
  getWaitlist
} from '../controllers/waitlistController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All waitlist routes require authentication
router.use(authenticateToken);

// Join waitlist for a game
router.post('/:gameId/join', joinWaitlist);

// Leave waitlist
router.delete('/:gameId/leave', leaveWaitlist);

// Get current user's waitlist status for a game
router.get('/:gameId/status', getWaitlistStatus);

// Get full waitlist for a game (creator only)
router.get('/:gameId/list', getWaitlist);

export default router;
