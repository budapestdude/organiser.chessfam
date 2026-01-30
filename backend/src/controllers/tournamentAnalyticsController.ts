import { Request, Response } from 'express';
import * as tournamentAnalyticsService from '../services/tournamentAnalyticsService';

export async function getTournamentAnalytics(req: Request, res: Response) {
  try {
    const tournamentId = parseInt(req.params.id);

    if (isNaN(tournamentId)) {
      return res.status(400).json({
        error: 'Invalid tournament ID'
      });
    }

    const analytics = await tournamentAnalyticsService.getTournamentAnalytics(tournamentId);
    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching tournament analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch tournament analytics',
      message: error.message
    });
  }
}
