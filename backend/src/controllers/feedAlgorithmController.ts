import { Request, Response, NextFunction } from 'express';
import * as feedAlgorithmService from '../services/feedAlgorithmService';
import { ValidationError, ForbiddenError } from '../utils/errors';

export const getAllSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await feedAlgorithmService.getAllSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

export const getSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const value = await feedAlgorithmService.getSetting(key);
    res.status(200).json({
      success: true,
      data: { key, value }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const isAdmin = (req as any).user?.is_admin;

    if (!userId || !isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      throw new ValidationError('Setting value is required');
    }

    await feedAlgorithmService.updateSetting(key, value, userId);

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

