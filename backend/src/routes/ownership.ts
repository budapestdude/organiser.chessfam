import express from 'express';
import * as ownershipController from '../controllers/ownershipController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware to validate entity type
const validateEntityType = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const validTypes = ['venue', 'club', 'tournament', 'community'];
  const entityType = req.params.entityType || req.query.entityType;

  if (entityType && !validTypes.includes(entityType as string)) {
    return res.status(400).json({
      message: `Invalid entity type. Must be one of: ${validTypes.join(', ')}`
    });
  }
  next();
};

// Middleware to check admin role
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ============ PUBLIC ROUTES ============

// Get ownership details for an entity
router.get(
  '/:entityType/:entityId',
  validateEntityType,
  ownershipController.getOwnership
);

// Get transfer history for an entity
router.get(
  '/:entityType/:entityId/history',
  validateEntityType,
  ownershipController.getTransferHistory
);

// ============ AUTHENTICATED ROUTES ============

// Get entities owned by current user
router.get(
  '/my-entities',
  authenticateToken,
  ownershipController.getMyEntities
);

// Transfer ownership to another user
router.post(
  '/:entityType/:entityId/transfer',
  authenticateToken,
  validateEntityType,
  ownershipController.transferOwnership
);

// Claim ownership with a claim code
router.post(
  '/:entityType/:entityId/claim',
  authenticateToken,
  validateEntityType,
  ownershipController.claimWithCode
);

// Submit a claim request (for review)
router.post(
  '/:entityType/:entityId/claim-request',
  authenticateToken,
  validateEntityType,
  ownershipController.submitClaimRequest
);

// Regenerate claim code (owner or admin)
router.post(
  '/:entityType/:entityId/regenerate-code',
  authenticateToken,
  validateEntityType,
  ownershipController.regenerateClaimCode
);

// ============ ADMIN ROUTES ============

// Get all pending claims
router.get(
  '/admin/pending-claims',
  authenticateToken,
  requireAdmin,
  ownershipController.getPendingClaims
);

// Get all unclaimed entities
router.get(
  '/admin/unclaimed',
  authenticateToken,
  requireAdmin,
  ownershipController.getUnclaimedEntities
);

// Review a claim request
router.post(
  '/admin/claims/:claimId/review',
  authenticateToken,
  requireAdmin,
  ownershipController.reviewClaimRequest
);

// Mark entity as unclaimed (generate claim code)
router.post(
  '/admin/:entityType/:entityId/mark-unclaimed',
  authenticateToken,
  requireAdmin,
  validateEntityType,
  ownershipController.markAsUnclaimed
);

export default router;
