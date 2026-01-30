import express from 'express';
import {
  signup,
  login,
  refreshToken,
  me,
  logout,
  verifyEmailHandler,
  resendVerificationHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  googleAuth,
  googleCallback,
  googleAuthStatus,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Public routes with rate limiting
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);

// Email verification
router.post('/verify-email', authLimiter, verifyEmailHandler);
router.post('/resend-verification', authLimiter, resendVerificationHandler);

// Password reset
router.post('/forgot-password', authLimiter, forgotPasswordHandler);
router.post('/reset-password', authLimiter, resetPasswordHandler);

// Protected routes
router.get('/me', authenticateToken, me);
router.post('/logout', authenticateToken, logout);

// Google OAuth routes
router.get('/google/status', googleAuthStatus); // Debug endpoint
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;
