import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';
import { ForbiddenError, ValidationError } from '../utils/errors';

/**
 * Track an analytics event (public endpoint)
 */
export const trackEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event_name, event_category, properties, session_id, anonymous_id, page_url, page_referrer } = req.body;

    if (!event_name || !event_category) {
      throw new ValidationError('event_name and event_category are required');
    }

    const user_id = (req as any).user?.userId;

    await analyticsService.trackEvent({
      event_name,
      event_category,
      user_id,
      session_id,
      anonymous_id,
      properties,
      page_url,
      page_referrer,
      user_agent: req.get('user-agent'),
      ip_address: req.ip
    });

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update session (public endpoint)
 */
export const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id, anonymous_id, entry_url, entry_referrer, device_type, browser, os } = req.body;

    if (!session_id) {
      throw new ValidationError('session_id is required');
    }

    const user_id = (req as any).user?.userId;

    await analyticsService.createOrUpdateSession(session_id, {
      user_id,
      anonymous_id,
      entry_url,
      entry_referrer,
      device_type,
      browser,
      os
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * End session (public endpoint)
 */
export const endSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id, exit_url } = req.body;

    if (!session_id) {
      throw new ValidationError('session_id is required');
    }

    await analyticsService.endSession(session_id, exit_url);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics summary (admin only)
 */
export const getAnalyticsSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as any).user?.is_admin;
    if (!isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { start_date, end_date } = req.query;

    const summary = await analyticsService.getAnalyticsSummary(
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversion funnel stats (admin only)
 */
export const getConversionFunnel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as any).user?.is_admin;
    if (!isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { funnel_name } = req.params;
    const { start_date, end_date } = req.query;

    if (!funnel_name) {
      throw new ValidationError('funnel_name is required');
    }

    const stats = await analyticsService.getConversionFunnelStats(
      funnel_name,
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Funnel not found'
      });
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top events (admin only)
 */
export const getTopEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as any).user?.is_admin;
    if (!isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { category, start_date, end_date, limit } = req.query;

    const events = await analyticsService.getTopEvents(
      category as string | undefined,
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined,
      limit ? parseInt(limit as string) : 10
    );

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user journey (admin only)
 */
export const getUserJourney = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as any).user?.is_admin;
    if (!isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { session_id } = req.params;

    if (!session_id) {
      throw new ValidationError('session_id is required');
    }

    const journey = await analyticsService.getUserJourney(session_id);

    res.status(200).json({
      success: true,
      data: journey
    });
  } catch (error) {
    next(error);
  }
};
