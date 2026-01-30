import express from 'express';
import {
  getUserAchievements,
  getUserStats
} from '../controllers/achievementController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.get('/user', authenticateToken, getUserAchievements);
router.get('/stats', authenticateToken, getUserStats);

export default router;
