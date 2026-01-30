import express from 'express';
import * as profileController from '../controllers/profileController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Search players (public)
router.get('/search', optionalAuth, profileController.searchPlayers);

// Heartbeat to update online status (authenticated)
router.post('/heartbeat', authenticateToken, profileController.heartbeat);

// My profile routes (authenticated)
router.get('/me', authenticateToken, profileController.getMyProfile);
router.put('/me', authenticateToken, profileController.updateMyProfile);
router.post('/me/change-password', authenticateToken, profileController.changePassword);
router.post('/me/change-email', authenticateToken, profileController.changeEmail);

// Public profile routes (must come after /me routes)
router.get('/:id', optionalAuth, profileController.getPublicProfile);

export default router;
