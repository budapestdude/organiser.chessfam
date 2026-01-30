import express from 'express';
import { getGameHistory, getGameStats, getUpcomingGames } from '../controllers/gameHistoryController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get game history
router.get('/', getGameHistory);

// Get game stats
router.get('/stats', getGameStats);

// Get upcoming games
router.get('/upcoming', getUpcomingGames);

export default router;
