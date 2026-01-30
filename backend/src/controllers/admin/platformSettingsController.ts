import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { ValidationError } from '../../utils/errors';
import { getPremiumDiscountSettings, updatePremiumDiscountSettings, getAllSettings } from '../../services/platformSettingsService';

/**
 * Get all platform settings (admin only)
 */
export const getAllPlatformSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getAllSettings();
    sendSuccess(res, settings, 'Platform settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get premium discount settings for author subscriptions
 */
export const getPremiumDiscountSettingsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getPremiumDiscountSettings();
    sendSuccess(res, settings, 'Premium discount settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update premium discount settings for author subscriptions
 */
export const updatePremiumDiscountSettingsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.userId;
    const { discountPercent, enabled } = req.body;

    // Validation
    if (discountPercent === undefined || enabled === undefined) {
      throw new ValidationError('discountPercent and enabled are required');
    }

    if (typeof enabled !== 'boolean') {
      throw new ValidationError('enabled must be a boolean');
    }

    if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
      throw new ValidationError('discountPercent must be a number between 0 and 100');
    }

    await updatePremiumDiscountSettings(discountPercent, enabled, adminId);

    const updated = await getPremiumDiscountSettings();
    sendSuccess(res, updated, 'Premium discount settings updated successfully');
  } catch (error) {
    next(error);
  }
};
