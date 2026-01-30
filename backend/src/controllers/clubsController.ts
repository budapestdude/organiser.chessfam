import { Request, Response, NextFunction } from 'express';
import * as clubsService from '../services/clubsService';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';
import { requireVerification } from '../services/verificationService';

export const getClubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, country, is_active, search, page = '1', limit = '20' } = req.query;

    const { clubs, total } = await clubsService.getClubs({
      city: city as string,
      country: country as string,
      is_active: is_active === 'false' ? false : true,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    sendPaginatedSuccess(res, { clubs, total }, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getClubById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const club = await clubsService.getClubById(parseInt(id));
    sendSuccess(res, club);
  } catch (error) {
    next(error);
  }
};

export const createClub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // TODO: Re-enable after migration 032 runs
    // Require identity verification for creating clubs
    // try {
    //   await requireVerification(req.user.userId);
    // } catch (verificationError: any) {
    //   return res.status(403).json({
    //     message: 'Identity verification required',
    //     error: verificationError.message,
    //     verification_required: true,
    //   });
    // }

    const club = await clubsService.createClub(req.user.userId, req.body);
    sendCreated(res, club, 'Club created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateClub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const club = await clubsService.updateClub(parseInt(id), req.user.userId, req.body);
    sendSuccess(res, club, 'Club updated successfully');
  } catch (error) {
    next(error);
  }
};

export const joinClub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    // TODO: Re-enable after migration 032 runs
    // Require identity verification for joining clubs
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
    const membership = await clubsService.joinClub(parseInt(id), req.user.userId);
    sendCreated(res, membership, 'Successfully joined the club');
  } catch (error) {
    next(error);
  }
};

export const leaveClub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    await clubsService.leaveClub(parseInt(id), req.user.userId);
    sendSuccess(res, null, 'Successfully left the club');
  } catch (error) {
    next(error);
  }
};

export const getClubMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const { members, total } = await clubsService.getClubMembers(
      parseInt(id),
      parseInt(page as string),
      parseInt(limit as string)
    );

    sendPaginatedSuccess(res, members, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserClubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const clubs = await clubsService.getUserClubs(req.user.userId);
    sendSuccess(res, clubs);
  } catch (error) {
    next(error);
  }
};

export const checkMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const isMember = await clubsService.isUserMember(parseInt(id), req.user.userId);
    sendSuccess(res, { isMember });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const { id, userId } = req.params;
    const { role } = req.body;

    if (!role || !['member', 'officer', 'admin'].includes(role)) {
      throw new ValidationError('Invalid role. Must be member, officer, or admin');
    }

    await clubsService.updateMemberRole(
      parseInt(id),
      req.user.userId,
      parseInt(userId),
      role
    );

    sendSuccess(res, null, 'Member role updated successfully');
  } catch (error) {
    next(error);
  }
};

// Transfer club ownership
export const transferClubOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id } = req.params;
    const { newOwnerId } = req.body;

    if (!newOwnerId) throw new ValidationError('New owner ID is required');

    await clubsService.transferOwnership(
      parseInt(id),
      req.user.userId,
      parseInt(newOwnerId)
    );

    sendSuccess(res, null, 'Ownership transferred successfully');
  } catch (error) {
    next(error);
  }
};

// Delete club
export const deleteClubController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id } = req.params;

    // Check if user is admin by querying the database
    const { query } = await import('../config/database');
    const adminCheck = await query('SELECT is_admin FROM users WHERE id = $1', [req.user.userId]);
    const isAdmin = adminCheck.rows.length > 0 && adminCheck.rows[0].is_admin === true;

    await clubsService.deleteClub(
      parseInt(id),
      req.user.userId,
      isAdmin
    );

    sendSuccess(res, null, 'Club deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Ban member
export const banClubMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id, userId } = req.params;

    await clubsService.banMember(
      parseInt(id),
      req.user.userId,
      parseInt(userId)
    );

    sendSuccess(res, null, 'Member banned successfully');
  } catch (error) {
    next(error);
  }
};

// Unban member
export const unbanClubMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id, userId } = req.params;

    await clubsService.unbanMember(
      parseInt(id),
      req.user.userId,
      parseInt(userId)
    );

    sendSuccess(res, null, 'Member unbanned successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================
// CLUB VENUES ENDPOINTS
// ============================================

// Get all venues for a club
export const getClubVenues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const venues = await clubsService.getClubVenues(parseInt(id));
    sendSuccess(res, venues);
  } catch (error) {
    next(error);
  }
};

// Add a venue to a club
export const addClubVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id } = req.params;
    const { venueId, isPrimary } = req.body;

    const clubVenue = await clubsService.addClubVenue(
      parseInt(id),
      parseInt(venueId),
      req.user.userId,
      isPrimary
    );

    sendSuccess(res, clubVenue, 'Venue added to club successfully');
  } catch (error) {
    next(error);
  }
};

// Remove a venue from a club
export const removeClubVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id, venueId } = req.params;

    await clubsService.removeClubVenue(
      parseInt(id),
      parseInt(venueId),
      req.user.userId
    );

    sendSuccess(res, null, 'Venue removed from club successfully');
  } catch (error) {
    next(error);
  }
};

// Set primary venue for a club
export const setPrimaryClubVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ValidationError('User not authenticated');

    const { id, venueId } = req.params;

    await clubsService.setPrimaryClubVenue(
      parseInt(id),
      parseInt(venueId),
      req.user.userId
    );

    sendSuccess(res, null, 'Primary venue set successfully');
  } catch (error) {
    next(error);
  }
};
