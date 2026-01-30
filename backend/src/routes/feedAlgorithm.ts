import express from 'express';
import * as feedAlgorithmController from '../controllers/feedAlgorithmController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all settings (requires admin)
router.get('/settings', authenticateToken, feedAlgorithmController.getAllSettings);

// Get specific setting (requires admin)
router.get('/settings/:key', authenticateToken, feedAlgorithmController.getSetting);

// Update specific setting (requires admin)
router.put('/settings/:key', authenticateToken, feedAlgorithmController.updateSetting);

export default router;
