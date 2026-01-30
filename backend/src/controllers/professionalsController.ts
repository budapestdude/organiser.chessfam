import { Request, Response, NextFunction } from 'express';
import * as professionalsService from '../services/professionalsService';
import * as applicationsService from '../services/professionalApplicationsService';
import * as bookingsService from '../services/professionalBookingsService';
import * as reviewsService from '../services/professionalReviewsService';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';

// ===== PUBLIC ENDPOINTS =====

/**
 * GET /api/professionals
 * Get all professionals with filtering and pagination
 */
export const getProfessionals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      professional_type,
      country,
      city,
      remote_available,
      specialties,
      min_rating,
      verified,
      available,
      featured,
      page = '1',
      limit = '20',
      sort_by,
      sort_order
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (professional_type) filters.professional_type = professional_type as string;
    if (country) filters.country = country as string;
    if (city) filters.city = city as string;
    if (remote_available !== undefined) filters.remote_available = remote_available === 'true';
    if (specialties) filters.specialties = (specialties as string).split(',');
    if (min_rating) filters.min_rating = parseFloat(min_rating as string);
    if (verified !== undefined) filters.verified = verified === 'true';
    if (available !== undefined) filters.available = available === 'true';
    if (featured !== undefined) filters.featured = featured === 'true';
    if (sort_by) filters.sort_by = sort_by as string;
    if (sort_order) filters.sort_order = sort_order as string;

    const { professionals, total } = await professionalsService.getProfessionals(filters);

    sendPaginatedSuccess(res, professionals, {
      page: filters.page,
      limit: filters.limit,
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/types
 * Get list of all professional types with counts
 */
export const getProfessionalTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = [
      { value: 'coach', label: 'Chess Coaches & Instructors' },
      { value: 'arbiter', label: 'Arbiters & Tournament Directors' },
      { value: 'photographer', label: 'Photographers' },
      { value: 'videographer', label: 'Videographers' },
      { value: 'analyst', label: 'Chess Analysts' },
      { value: 'commentator', label: 'Commentators & Streamers' },
      { value: 'influencer', label: 'Influencers' },
      { value: 'writer', label: 'Writers & Journalists' },
      { value: 'dgt_operator', label: 'DGT Operators' },
      { value: 'programmer', label: 'Programmers & Developers' },
      { value: 'editor', label: 'Editors' },
      { value: 'designer', label: 'Designers' },
      { value: 'producer', label: 'Producers' }
    ];

    sendSuccess(res, types);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/:id
 * Get professional by ID
 */
export const getProfessionalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const professional = await professionalsService.getProfessionalById(parseInt(id));
    sendSuccess(res, professional);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/:id/services
 * Get services for a professional
 */
export const getProfessionalServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const services = await professionalsService.getProfessionalServices(parseInt(id));
    sendSuccess(res, services);
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/professionals/search
 * Search professionals by name or bio
 */
export const searchProfessionals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, professional_type, page = '1', limit = '20' } = req.query;

    if (!q || typeof q !== 'string') {
      throw new ValidationError('Search query (q) is required');
    }

    const { professionals, total } = await professionalsService.searchProfessionals(
      q as string,
      {
        professional_type: professional_type as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    );

    sendPaginatedSuccess(res, professionals, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/featured
 * Get featured professionals
 */
export const getFeaturedProfessionals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, limit = '10' } = req.query;

    const professionals = await professionalsService.getFeaturedProfessionals(
      type as any,
      parseInt(limit as string)
    );

    sendSuccess(res, professionals);
  } catch (error) {
    next(error);
  }
};

// ===== AUTHENTICATED USER ENDPOINTS =====

/**
 * POST /api/professionals/apply
 * Apply to become a professional
 */
export const applyAsProfessional = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const application = await applicationsService.applyAsProfessional(req.user.userId, req.body);
    sendCreated(res, application, 'Professional application submitted successfully. An admin will review it soon.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/application/me
 * Get current user's application
 */
export const getMyApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { type } = req.query;
    const application = await applicationsService.getMyApplication(
      req.user.userId,
      type as any
    );

    sendSuccess(res, application);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/professionals/application/me
 * Update current user's application
 */
export const updateMyApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { application_id, ...updateData } = req.body;

    if (!application_id) {
      throw new ValidationError('application_id is required');
    }

    const application = await applicationsService.updateMyApplication(
      req.user.userId,
      application_id,
      updateData
    );

    sendSuccess(res, application, 'Application updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/profile/me
 * Get current user's professional profile
 */
export const getMyProfessionalProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const professional = await professionalsService.getProfessionalByUserId(req.user.userId);
    sendSuccess(res, professional);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/professionals/profile/me
 * Update current user's professional profile
 */
export const updateMyProfessionalProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const professional = await professionalsService.updateProfessionalProfile(
      req.user.userId,
      req.body
    );

    sendSuccess(res, professional, 'Professional profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/professionals/services/me
 * Update current user's services
 */
export const updateMyServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { services } = req.body;

    if (!Array.isArray(services)) {
      throw new ValidationError('services must be an array');
    }

    const updatedServices = await professionalsService.updateProfessionalServices(
      req.user.userId,
      services
    );

    sendSuccess(res, updatedServices, 'Services updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/stats/me
 * Get current user's professional stats
 */
export const getMyProfessionalStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const stats = await professionalsService.getProfessionalStats(req.user.userId);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

// ===== ADMIN ENDPOINTS =====

/**
 * GET /api/professionals/admin/applications
 * Get pending applications (admin only)
 */
export const getPendingApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      professional_type,
      status = 'pending',
      page = '1',
      limit = '20'
    } = req.query;

    const { applications, total } = await applicationsService.getPendingApplications({
      professional_type: professional_type as any,
      status: status as any,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    sendPaginatedSuccess(res, applications, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/admin/applications/:id
 * Get application by ID (admin only)
 */
export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const application = await applicationsService.getApplicationById(parseInt(id));
    sendSuccess(res, application);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/professionals/admin/applications/:id/approve
 * Approve application (admin only)
 */
export const approveApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const professional = await applicationsService.approveApplication(
      parseInt(id),
      req.user.userId
    );

    sendCreated(res, professional, 'Application approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/professionals/admin/applications/:id/reject
 * Reject application (admin only)
 */
export const rejectApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { reason } = req.body;

    await applicationsService.rejectApplication(
      parseInt(id),
      req.user.userId,
      reason
    );

    sendSuccess(res, null, 'Application rejected successfully');
  } catch (error) {
    next(error);
  }
};

// ===== BOOKING ENDPOINTS =====

/**
 * POST /api/professionals/bookings
 * Create a new booking (authenticated users only)
 */
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const booking = await bookingsService.createBooking(req.user.userId, req.body);
    sendCreated(res, booking, 'Booking created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/bookings/me
 * Get current user's bookings
 */
export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { status, page = '1', limit = '20' } = req.query;

    const { bookings, total } = await bookingsService.getUserBookings(req.user.userId, {
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    sendPaginatedSuccess(res, bookings, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/:id/bookings
 * Get bookings for a professional (professional owner or admin only)
 */
export const getProfessionalBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { status, page = '1', limit = '20' } = req.query;

    // Verify user owns this professional profile or is admin
    const professional = await professionalsService.getProfessionalById(parseInt(id));
    if (!professional) {
      throw new ValidationError('Professional not found');
    }

    if (professional.user_id !== req.user.userId && !req.user.is_admin) {
      throw new ValidationError('Not authorized to view these bookings');
    }

    const { bookings, total } = await bookingsService.getProfessionalBookings(parseInt(id), {
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    sendPaginatedSuccess(res, bookings, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/bookings/:id
 * Get booking by ID
 */
export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const booking = await bookingsService.getBookingById(parseInt(id));

    if (!booking) {
      throw new ValidationError('Booking not found');
    }

    // Check if user is the client, professional, or admin
    const professional = await professionalsService.getProfessionalById(booking.professional_id);
    if (
      booking.user_id !== req.user.userId &&
      professional?.user_id !== req.user.userId &&
      !req.user.is_admin
    ) {
      throw new ValidationError('Not authorized to view this booking');
    }

    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/professionals/bookings/:id/status
 * Update booking status
 */
export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const booking = await bookingsService.updateBookingStatus(
      parseInt(id),
      status,
      req.user.userId,
      req.user.is_admin
    );

    sendSuccess(res, booking, 'Booking status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/professionals/bookings/:id/complete
 * Mark booking as completed
 */
export const completeBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const booking = await bookingsService.completeBooking(parseInt(id), req.user.userId);
    sendSuccess(res, booking, 'Booking marked as completed');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/professionals/bookings/:id/cancel
 * Cancel booking
 */
export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const booking = await bookingsService.cancelBooking(parseInt(id), req.user.userId);
    sendSuccess(res, booking, 'Booking cancelled successfully');
  } catch (error) {
    next(error);
  }
};

// ===== REVIEW ENDPOINTS =====

/**
 * POST /api/professionals/reviews
 * Create a review for a professional
 */
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const review = await reviewsService.createReview(req.user.userId, req.body);
    sendCreated(res, review, 'Review created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/:id/reviews
 * Get reviews for a professional
 */
export const getProfessionalReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', min_rating } = req.query;

    const { reviews, total } = await reviewsService.getReviewsByProfessional(parseInt(id), {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      min_rating: min_rating ? parseInt(min_rating as string) : undefined
    });

    sendPaginatedSuccess(res, reviews, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/:id/reviews/breakdown
 * Get rating breakdown for a professional
 */
export const getRatingBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const breakdown = await reviewsService.getRatingBreakdown(parseInt(id));
    sendSuccess(res, breakdown);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/professionals/:id/can-review
 * Check if current user can review this professional
 */
export const canUserReviewProfessional = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const result = await reviewsService.canUserReview(req.user.userId, parseInt(id));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/professionals/reviews/:id
 * Delete a review (admin only)
 */
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await reviewsService.deleteReview(parseInt(id));
    sendSuccess(res, null, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};
