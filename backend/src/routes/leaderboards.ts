import express from 'express';
import { getLeaderboard, getUserRank } from '../controllers/leaderboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get leaderboard (public)
router.get('/', getLeaderboard);

// Get current user's rank (requires authentication)
router.get('/rank', authenticateToken, getUserRank);

export default router;
