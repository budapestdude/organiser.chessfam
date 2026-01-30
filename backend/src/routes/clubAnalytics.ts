import express from 'express';
import * as analyticsController from '../controllers/clubAnalyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All analytics routes require authentication and owner/admin permissions
router.get('/clubs/:id/analytics', authenticateToken, analyticsController.getClubAnalytics);
router.get('/clubs/:id/members/details', authenticateToken, analyticsController.getMemberDetails);

export default router;
