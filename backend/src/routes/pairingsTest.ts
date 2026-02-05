import express from 'express';
import * as pairingsTestController from '../controllers/pairingsTestController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Test endpoint to view TRF file (plain text)
router.get('/:tournamentId/trf',
  authenticateToken,
  pairingsTestController.viewTRFFile
);

// Test endpoint to view TRF file with debug info (JSON)
router.get('/:tournamentId/trf/debug',
  authenticateToken,
  pairingsTestController.viewTRFFileDebug
);

export default router;
