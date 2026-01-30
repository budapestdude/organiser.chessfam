import { Request, Response, NextFunction } from 'express';
import { getDashboardStats, getRecentActivity } from '../../services/admin/dashboardService';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await getRecentActivity(limit);
    res.json({ activity });
  } catch (error) {
    next(error);
  }
};
