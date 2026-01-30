import { Request, Response, NextFunction } from 'express';
import * as mastersService from '../services/mastersService';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';

export const getMasters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { available, title, min_rating, max_price, page = '1', limit = '20' } = req.query;

    const { masters, total } = await mastersService.getMasters({
      available: available === 'false' ? false : true,
      title: title as string,
      min_rating: min_rating ? parseInt(min_rating as string) : undefined,
      max_price: max_price ? parseFloat(max_price as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    sendPaginatedSuccess(res, masters, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getMasterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const master = await mastersService.getMasterById(parseInt(id));
    sendSuccess(res, master);
  } catch (error) {
    next(error);
  }
};

export const applyToBeMaster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const application = await mastersService.applyToBeMaster(req.user.userId, req.body);
    sendCreated(res, application, 'Master application submitted successfully');
  } catch (error) {
    next(error);
  }
};

export const getMyApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const application = await mastersService.getMyApplication(req.user.userId);
    sendSuccess(res, application);
  } catch (error) {
    next(error);
  }
};

export const updateMyApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const application = await mastersService.updateMyApplication(req.user.userId, req.body);
    sendSuccess(res, application, 'Application updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getMyMasterProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const master = await mastersService.getMasterByUserId(req.user.userId);
    sendSuccess(res, master);
  } catch (error) {
    next(error);
  }
};

export const updateMyMasterProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const master = await mastersService.updateMasterProfile(req.user.userId, req.body);
    sendSuccess(res, master, 'Master profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// Admin endpoints
export const getPendingApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const { applications, total } = await mastersService.getPendingApplications(
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendPaginatedSuccess(res, applications, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const approveApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const master = await mastersService.approveApplication(parseInt(id), req.user.userId);
    sendSuccess(res, master, 'Application approved successfully');
  } catch (error) {
    next(error);
  }
};

export const rejectApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new ValidationError('Rejection reason is required');
    }

    await mastersService.rejectApplication(parseInt(id), req.user.userId, reason);
    sendSuccess(res, null, 'Application rejected');
  } catch (error) {
    next(error);
  }
};

// ===== EVENT AVAILABILITY ENDPOINTS =====

/**
 * PUT /api/masters/event-availability
 * Update master's event availability settings (authenticated master only)
 */
export const updateEventAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    await mastersService.updateMasterEventAvailability(req.user.userId, req.body);
    sendSuccess(res, null, 'Event availability updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/masters/available-for-events
 * Get masters available for events with optional filtering
 */
export const getMastersAvailableForEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      event_type,
      min_rating,
      max_rate,
      page = '1',
      limit = '20'
    } = req.query;

    const { masters, total } = await mastersService.getMastersAvailableForEvents({
      event_type: event_type as string,
      min_rating: min_rating ? parseInt(min_rating as string) : undefined,
      max_rate: max_rate ? parseFloat(max_rate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    sendPaginatedSuccess(res, masters, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total
    });
  } catch (error) {
    next(error);
  }
};
