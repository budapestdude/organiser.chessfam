import { Request, Response, NextFunction } from 'express';
import * as tournamentsService from '../services/tournamentsService';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../utils/response';
import { ValidationError, ForbiddenError } from '../utils/errors';
import { requireVerification } from '../services/verificationService';
import { query } from '../config/database';

export const getTournaments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, format, city, search, upcoming, page = '1', limit = '20' } = req.query;

    const { tournaments, total } = await tournamentsService.getTournaments({
      status: status as string,
      format: format as string,
      city: city as string,
      search: search as string,
      upcoming: upcoming === 'true',
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    sendPaginatedSuccess(res, tournaments, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getTournamentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tournament = await tournamentsService.getTournamentById(parseInt(id));
    sendSuccess(res, tournament);
  } catch (error) {
    next(error);
  }
};

export const createTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // TODO: Re-enable after migration 032 runs
    // Require identity verification for creating tournaments
    // try {
    //   await requireVerification(req.user.userId);
    // } catch (verificationError: any) {
    //   return res.status(403).json({
    //     message: 'Identity verification required',
    //     error: verificationError.message,
    //     verification_required: true,
    //   });
    // }

    const tournament = await tournamentsService.createTournament(req.user.userId, req.body);
    sendCreated(res, tournament, 'Tournament created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    // Check if user is admin
    const userResult = await query('SELECT is_admin FROM users WHERE id = $1', [req.user.userId]);
    const isAdmin = userResult.rows[0]?.is_admin || false;

    const tournament = await tournamentsService.updateTournament(
      parseInt(id),
      req.user.userId,
      req.body,
      isAdmin
    );
    sendSuccess(res, tournament, 'Tournament updated successfully');
  } catch (error) {
    next(error);
  }
};

export const registerForTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // TODO: Re-enable after migration 032 runs
    // Require identity verification for tournament registration
    // try {
    //   await requireVerification(req.user.userId);
    // } catch (verificationError: any) {
    //   return res.status(403).json({
    //     message: 'Identity verification required',
    //     error: verificationError.message,
    //     verification_required: true,
    //   });
    // }

    const { id } = req.params;
    const registration = await tournamentsService.registerForTournament(
      parseInt(id),
      req.user.userId
    );
    sendCreated(res, registration, 'Successfully registered for tournament');
  } catch (error) {
    next(error);
  }
};

export const withdrawFromTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    await tournamentsService.withdrawFromTournament(parseInt(id), req.user.userId);
    sendSuccess(res, null, 'Successfully withdrawn from tournament');
  } catch (error) {
    next(error);
  }
};

export const getTournamentParticipants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const { participants, total } = await tournamentsService.getTournamentParticipants(
      parseInt(id),
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendPaginatedSuccess(res, participants, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserTournaments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const tournaments = await tournamentsService.getUserTournaments(req.user.userId);
    sendSuccess(res, tournaments);
  } catch (error) {
    next(error);
  }
};

export const checkRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const isRegistered = await tournamentsService.isUserRegistered(
      parseInt(id),
      req.user.userId
    );
    sendSuccess(res, { isRegistered });
  } catch (error) {
    next(error);
  }
};

export const getMyTournaments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const tournaments = await tournamentsService.getMyTournaments(req.user.userId);
    sendSuccess(res, tournaments);
  } catch (error) {
    next(error);
  }
};

export const deleteTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    await tournamentsService.deleteTournament(parseInt(id), req.user.userId);
    sendSuccess(res, null, 'Tournament deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const createTournamentSeries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { seriesData, firstEditionData } = req.body;
    const result = await tournamentsService.createTournamentSeries(
      seriesData,
      firstEditionData,
      req.user.userId
    );
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const getAllTournamentSeries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[getAllTournamentSeries] Endpoint called');
    const series = await tournamentsService.getAllTournamentSeries();
    console.log('[getAllTournamentSeries] Found series count:', series.length);
    sendSuccess(res, series);
  } catch (error) {
    console.error('[getAllTournamentSeries] Error:', error);
    next(error);
  }
};

export const updateTournamentSeries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[updateTournamentSeries Controller] Request received:', {
      params: req.params,
      body: req.body,
      user: req.user
    });

    if (!req.user) {
      console.error('[updateTournamentSeries Controller] User not authenticated');
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { name, description, image, images, organizer_name_override } = req.body;

    console.log('[updateTournamentSeries Controller] Calling service with:', {
      id: parseInt(id),
      userId: req.user.userId,
      updateData: { name, description, image, images, organizer_name_override }
    });

    const updatedSeries = await tournamentsService.updateTournamentSeries(
      parseInt(id),
      req.user.userId,
      { name, description, image, images, organizer_name_override }
    );

    console.log('[updateTournamentSeries Controller] Update successful');
    sendSuccess(res, updatedSeries, 'Tournament series updated successfully');
  } catch (error) {
    console.error('[updateTournamentSeries Controller] Error:', error);
    next(error);
  }
};

export const getTournamentSeries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const seriesData = await tournamentsService.getTournamentSeries(parseInt(id));
    sendSuccess(res, seriesData);
  } catch (error) {
    next(error);
  }
};

export const getTournamentSeriesImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const images = await tournamentsService.getTournamentSeriesImages(parseInt(id));
    sendSuccess(res, { images });
  } catch (error) {
    next(error);
  }
};

export const getTournamentSeriesReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const reviewsData = await tournamentsService.getTournamentSeriesReviews(
      parseInt(id),
      parseInt(page as string),
      parseInt(limit as string)
    );
    // Use custom response to include averageRating
    res.status(200).json({
      success: true,
      data: reviewsData.reviews,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: reviewsData.total,
        averageRating: reviewsData.averageRating
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createTournamentSeriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const { seriesData, firstEditionData } = req.body;
    const result = await tournamentsService.createTournamentSeries(
      seriesData,
      firstEditionData,
      userId
    );
    sendSuccess(res, result, 'Tournament series created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ============ FESTIVAL ENDPOINTS ============

export const convertToFestivalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const tournamentId = parseInt(req.params.id);
    const result = await tournamentsService.convertToFestival(tournamentId, userId);
    sendSuccess(res, result, 'Tournament converted to festival successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const createFestivalEventController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const festivalId = parseInt(req.params.festivalId);
    const event = await tournamentsService.createFestivalEvent(festivalId, userId, req.body);
    sendSuccess(res, event, 'Festival event created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getFestivalEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const festivalId = parseInt(req.params.festivalId);
    const events = await tournamentsService.getFestivalEvents(festivalId);
    sendSuccess(res, events, 'Festival events retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const removeFestivalEventController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const eventId = parseInt(req.params.eventId);
    const result = await tournamentsService.removeFestivalEvent(eventId, userId);
    sendSuccess(res, result, 'Event removed from festival successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteFestivalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const festivalId = parseInt(req.params.festivalId);
    await tournamentsService.deleteFestival(festivalId, userId);
    sendSuccess(res, null, 'Festival deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ===== REFUND ENDPOINTS =====

export const checkRefundEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const registrationId = parseInt(req.params.registrationId);
    const eligibility = await tournamentsService.checkRefundEligibility(registrationId, userId);

    sendSuccess(res, eligibility);
  } catch (error) {
    next(error);
  }
};

export const requestRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const registrationId = parseInt(req.params.registrationId);
    const { reason } = req.body;

    const refund = await tournamentsService.requestRefund(registrationId, userId, reason);

    // Automatically process the refund
    const result = await tournamentsService.processRefund(refund.id);

    sendSuccess(res, {
      ...refund,
      processing_result: result
    }, 'Refund processed successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserRefunds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const refunds = await tournamentsService.getUserRefunds(userId);
    sendSuccess(res, refunds);
  } catch (error) {
    next(error);
  }
};

export const getTournamentRefunds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ForbiddenError('Authentication required');
    }

    const tournamentId = parseInt(req.params.tournamentId);
    const refunds = await tournamentsService.getTournamentRefunds(tournamentId, userId);

    sendSuccess(res, refunds);
  } catch (error) {
    next(error);
  }
};
