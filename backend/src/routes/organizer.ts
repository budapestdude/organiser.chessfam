import express from 'express';
import * as organizerController from '../controllers/organizerController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Dashboard endpoint - get overview of owned tournaments and clubs
router.get('/dashboard', authenticateToken, organizerController.getDashboard);

// Financials endpoint - get financial reports
router.get('/financials', authenticateToken, organizerController.getFinancials);

export default router;
