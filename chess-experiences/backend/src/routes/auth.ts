import express from 'express';
import { signup, login, refreshToken, me, logout } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Public routes with rate limiting
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);

// Protected routes
router.get('/me', authenticateToken, me);
router.post('/logout', authenticateToken, logout);

export default router;
