import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  submitIdentityVerification,
  getVerificationStatus,
  checkVerificationRequired,
} from '../controllers/verificationController';

const router = express.Router();

// All verification routes require authentication
router.use(authenticateToken);

// Submit verification
router.post('/submit', submitIdentityVerification);

// Get user's verification status
router.get('/status', getVerificationStatus);

// Check if verification is required
router.get('/check', checkVerificationRequired);

export default router;
