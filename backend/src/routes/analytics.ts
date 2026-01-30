import express from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public endpoints (for tracking from frontend)
router.post('/track', optionalAuth, analyticsController.trackEvent);
router.post('/session/start', optionalAuth, analyticsController.createSession);
router.post('/session/end', optionalAuth, analyticsController.endSession);

// Admin endpoints
router.get('/summary', authenticateToken, analyticsController.getAnalyticsSummary);
router.get('/funnel/:funnel_name', authenticateToken, analyticsController.getConversionFunnel);
router.get('/top-events', authenticateToken, analyticsController.getTopEvents);
router.get('/journey/:session_id', authenticateToken, analyticsController.getUserJourney);

export default router;
