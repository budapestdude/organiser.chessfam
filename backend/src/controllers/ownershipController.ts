import { Request, Response } from 'express';
import * as ownershipService from '../services/ownershipService';
import { EntityType } from '../services/ownershipService';

// Get ownership details for an entity
export const getOwnership = async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;

  try {
    const ownership = await ownershipService.getEntityOwnership(
      entityType as EntityType,
      parseInt(entityId)
    );

    res.json({ data: ownership });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Transfer ownership to another user
export const transferOwnership = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { entityType, entityId } = req.params;
  const { newOwnerId, reason } = req.body;

  if (!newOwnerId) {
    return res.status(400).json({ message: 'New owner ID is required' });
  }

  try {
    const transfer = await ownershipService.transferOwnership(
      entityType as EntityType,
      parseInt(entityId),
      userId,
      parseInt(newOwnerId),
      reason
    );

    res.json({
      message: 'Ownership transferred successfully',
      data: transfer
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Claim ownership with a claim code
export const claimWithCode = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { entityType, entityId } = req.params;
  const { claimCode } = req.body;

  if (!claimCode) {
    return res.status(400).json({ message: 'Claim code is required' });
  }

  try {
    const transfer = await ownershipService.claimWithCode(
      entityType as EntityType,
      parseInt(entityId),
      claimCode,
      userId
    );

    res.json({
      message: 'Ownership claimed successfully',
      data: transfer
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Submit a claim request
export const submitClaimRequest = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { entityType, entityId } = req.params;
  const { claimReason, verificationInfo } = req.body;

  if (!claimReason) {
    return res.status(400).json({ message: 'Claim reason is required' });
  }

  try {
    const claim = await ownershipService.submitClaimRequest(
      entityType as EntityType,
      parseInt(entityId),
      userId,
      claimReason,
      verificationInfo
    );

    res.status(201).json({
      message: 'Claim request submitted. An admin will review your request.',
      data: claim
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Review a claim request (admin only)
export const reviewClaimRequest = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { claimId } = req.params;
  const { approved, reviewNotes } = req.body;

  if (typeof approved !== 'boolean') {
    return res.status(400).json({ message: 'Approved status is required (true/false)' });
  }

  try {
    const claim = await ownershipService.reviewClaimRequest(
      parseInt(claimId),
      userId,
      approved,
      reviewNotes
    );

    res.json({
      message: `Claim ${approved ? 'approved' : 'rejected'} successfully`,
      data: claim
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get pending claims (admin only)
export const getPendingClaims = async (req: Request, res: Response) => {
  const { entityType } = req.query;

  try {
    const claims = await ownershipService.getPendingClaims(
      entityType as EntityType | undefined
    );

    res.json({ data: claims });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get transfer history
export const getTransferHistory = async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;

  try {
    const history = await ownershipService.getTransferHistory(
      entityType as EntityType,
      parseInt(entityId)
    );

    res.json({ data: history });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Regenerate claim code (owner or admin)
export const regenerateClaimCode = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { entityType, entityId } = req.params;

  try {
    const newCode = await ownershipService.regenerateClaimCode(
      entityType as EntityType,
      parseInt(entityId),
      userId
    );

    res.json({
      message: 'New claim code generated',
      data: { claimCode: newCode }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get entities owned by current user
export const getMyEntities = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { entityType } = req.query;

  try {
    const entities = await ownershipService.getOwnedEntities(
      userId,
      entityType as EntityType | undefined
    );

    res.json({ data: entities });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get unclaimed entities (admin only)
export const getUnclaimedEntities = async (req: Request, res: Response) => {
  const { entityType } = req.query;

  try {
    const entities = await ownershipService.getUnclaimedEntities(
      entityType as EntityType | undefined
    );

    res.json({ data: entities });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Admin: Create entity as unclaimed (generate claim code)
export const markAsUnclaimed = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { entityType, entityId } = req.params;

  try {
    const claimCode = await ownershipService.createUnclaimedEntity(
      entityType as EntityType,
      parseInt(entityId),
      userId
    );

    res.json({
      message: 'Entity marked as unclaimed. Share the claim code with the intended owner.',
      data: { claimCode }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
