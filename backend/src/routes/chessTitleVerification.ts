import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as chessTitleVerificationController from '../controllers/chessTitleVerificationController';

const router = express.Router();

// All routes require authentication
router.post('/submit', authenticateToken, chessTitleVerificationController.submitChessTitleVerification);
router.get('/status', authenticateToken, chessTitleVerificationController.getChessTitleVerificationStatus);
router.get('/check', authenticateToken, chessTitleVerificationController.checkTitleVerificationRequired);

export default router;
