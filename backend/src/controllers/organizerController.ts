import { Request, Response } from 'express';
import * as organizerService from '../services/organizerService';

export async function getDashboard(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const dashboardData = await organizerService.getDashboard(userId);
    res.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching organizer dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
}

export async function getFinancials(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing required query parameters: from and to dates'
      });
    }

    const financialData = await organizerService.getFinancials(
      userId,
      from as string,
      to as string
    );
    res.json(financialData);
  } catch (error: any) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({
      error: 'Failed to fetch financial data',
      message: error.message
    });
  }
}
