import { Request, Response, NextFunction } from 'express';
import {
  submitVerification,
  getUserVerificationStatus,
  hasPendingVerification,
  isUserVerified,
  directlyVerifyUser,
  revokeVerification,
} from '../services/verificationService';
import { ValidationError } from '../utils/errors';

// Submit identity verification
export const submitIdentityVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ValidationError('User not authenticated');

    const verification = await submitVerification(userId, req.body);

    res.status(201).json({
      message: 'Verification submitted successfully. Our team will review it within 24-48 hours.',
      verification: {
        id: verification.id,
        status: verification.status,
        created_at: verification.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's verification status
export const getVerificationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ValidationError('User not authenticated');

    const status = await getUserVerificationStatus(userId);

    res.json(status);
  } catch (error) {
    next(error);
  }
};

// Check if verification is required (used by frontend)
export const checkVerificationRequired = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ValidationError('User not authenticated');

    const [hasPending, isVerified] = await Promise.all([
      hasPendingVerification(userId),
      isUserVerified(userId),
    ]);

    res.json({
      is_verified: isVerified,
      has_pending_verification: hasPending,
      verification_required: !isVerified && !hasPending,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Directly verify a user (without application)
export const adminDirectlyVerifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const { userId } = req.params;
    const { reason } = req.body;

    await directlyVerifyUser(parseInt(userId), adminId, reason);

    res.json({
      message: 'User verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Revoke user verification
export const adminRevokeVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new ValidationError('Revocation reason is required');
    }

    await revokeVerification(parseInt(userId), adminId, reason);

    res.json({
      message: 'User verification revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};
