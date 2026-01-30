import { Request, Response } from 'express';
import * as chessTitleVerificationService from '../services/chessTitleVerificationService';

/**
 * Submit a chess title verification request
 * POST /api/chess-title-verification/submit
 */
export const submitChessTitleVerification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { claimed_title, fide_id, certificate_image } = req.body;

    // Validate required fields
    if (!claimed_title) {
      return res.status(400).json({ error: 'Claimed title is required' });
    }

    if (!certificate_image) {
      return res.status(400).json({ error: 'Certificate image is required' });
    }

    const verification = await chessTitleVerificationService.submitTitleVerification(userId, {
      claimed_title,
      fide_id,
      certificate_image,
    });

    res.status(201).json({
      message: 'Chess title verification submitted successfully',
      data: verification,
    });
  } catch (error: any) {
    console.error('Error submitting chess title verification:', error);
    res.status(400).json({ error: error.message || 'Failed to submit chess title verification' });
  }
};

/**
 * Get user's chess title verification status
 * GET /api/chess-title-verification/status
 */
export const getChessTitleVerificationStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const status = await chessTitleVerificationService.getUserTitleVerificationStatus(userId);

    res.json({ data: status });
  } catch (error: any) {
    console.error('Error getting chess title verification status:', error);
    res.status(400).json({ error: error.message || 'Failed to get verification status' });
  }
};

/**
 * Check if title verification is required
 * GET /api/chess-title-verification/check
 */
export const checkTitleVerificationRequired = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPending = await chessTitleVerificationService.hasPendingTitleVerification(userId);
    const isVerified = await chessTitleVerificationService.isUserTitleVerified(userId);

    res.json({
      data: {
        has_pending: hasPending,
        is_verified: isVerified,
        can_submit: !hasPending && !isVerified,
      },
    });
  } catch (error: any) {
    console.error('Error checking title verification requirement:', error);
    res.status(400).json({ error: error.message || 'Failed to check verification requirement' });
  }
};

/**
 * Admin: Directly verify a user's chess title
 * POST /api/admin/users/:userId/verify-chess-title
 */
export const adminDirectlyVerifyUserTitle = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.userId;
    const isAdmin = (req as any).user?.isAdmin;

    if (!adminId || !isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { title, reason } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    await chessTitleVerificationService.directlyVerifyUserTitle(
      parseInt(userId),
      adminId,
      title,
      reason
    );

    res.json({ message: 'User chess title verified successfully' });
  } catch (error: any) {
    console.error('Error directly verifying user chess title:', error);
    res.status(400).json({ error: error.message || 'Failed to verify chess title' });
  }
};

/**
 * Admin: Revoke a user's chess title verification
 * POST /api/admin/users/:userId/revoke-chess-title
 */
export const adminRevokeTitleVerification = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.userId;
    const isAdmin = (req as any).user?.isAdmin;

    if (!adminId || !isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    await chessTitleVerificationService.revokeUserTitleVerification(
      parseInt(userId),
      adminId,
      reason
    );

    res.json({ message: 'User chess title verification revoked successfully' });
  } catch (error: any) {
    console.error('Error revoking user chess title verification:', error);
    res.status(400).json({ error: error.message || 'Failed to revoke chess title verification' });
  }
};
