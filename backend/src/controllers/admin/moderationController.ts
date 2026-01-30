import { Request, Response, NextFunction } from 'express';
import {
  getReviews,
  deleteReview,
  getPendingVenues,
  approveVenue,
  rejectVenue,
  getPendingMasterApplications,
  approveMasterApplication,
  rejectMasterApplication,
  getPendingOwnershipClaims,
  approveOwnershipClaim,
  rejectOwnershipClaim,
  getPendingTournaments,
  approveTournament,
  rejectTournament,
  getPendingClubs,
  approveClub,
  rejectClub,
  getPendingIdentityVerifications,
  getIdentityVerificationById,
  approveIdentityVerification,
  rejectIdentityVerification,
  getPendingChessTitleVerifications,
  getChessTitleVerificationById,
  approveChessTitleVerification,
  rejectChessTitleVerification,
} from '../../services/admin/moderationService';
import { ValidationError } from '../../utils/errors';

// Reviews
export const listReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as 'player' | 'venue' | 'club' | 'tournament' | 'all' | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getReviews({ type, page, limit });

    res.json({
      reviews: result.reviews,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const { type, id } = req.params;
    const reviewId = parseInt(id);

    if (!type || !reviewId) {
      throw new ValidationError('Review type and ID are required');
    }

    await deleteReview(type, reviewId, adminId);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Venues
export const listPendingVenues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getPendingVenues(page, limit);

    res.json({
      venues: result.venues,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveVenueHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const venueId = parseInt(req.params.id);
    if (!venueId) throw new ValidationError('Invalid venue ID');

    const venue = await approveVenue(venueId, adminId);
    res.json({ venue, message: 'Venue approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectVenueHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const venueId = parseInt(req.params.id);
    if (!venueId) throw new ValidationError('Invalid venue ID');

    const { reason } = req.body;

    const venue = await rejectVenue(venueId, adminId, reason);
    res.json({ venue, message: 'Venue rejected successfully' });
  } catch (error) {
    next(error);
  }
};

// Master Applications
export const listPendingMasters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getPendingMasterApplications(page, limit);

    res.json({
      applications: result.applications,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveMasterHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const applicationId = parseInt(req.params.id);
    if (!applicationId) throw new ValidationError('Invalid application ID');

    const application = await approveMasterApplication(applicationId, adminId);
    res.json({ application, message: 'Master application approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectMasterHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const applicationId = parseInt(req.params.id);
    if (!applicationId) throw new ValidationError('Invalid application ID');

    const { reason } = req.body;

    const application = await rejectMasterApplication(applicationId, adminId, reason);
    res.json({ application, message: 'Master application rejected successfully' });
  } catch (error) {
    next(error);
  }
};

// Ownership Claims
export const listPendingClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getPendingOwnershipClaims(page, limit);

    res.json({
      claims: result.claims,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveClaimHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const claimId = parseInt(req.params.id);
    if (!claimId) throw new ValidationError('Invalid claim ID');

    const claim = await approveOwnershipClaim(claimId, adminId);
    res.json({ claim, message: 'Ownership claim approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectClaimHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const claimId = parseInt(req.params.id);
    if (!claimId) throw new ValidationError('Invalid claim ID');

    const { reason } = req.body;

    const claim = await rejectOwnershipClaim(claimId, adminId, reason);
    res.json({ claim, message: 'Ownership claim rejected successfully' });
  } catch (error) {
    next(error);
  }
};

// Tournaments
export const listPendingTournaments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getPendingTournaments(page, limit);

    res.json({
      tournaments: result.tournaments,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveTournamentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const tournamentId = parseInt(req.params.id);
    if (!tournamentId) throw new ValidationError('Invalid tournament ID');

    const tournament = await approveTournament(tournamentId, adminId);
    res.json({ tournament, message: 'Tournament approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectTournamentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const tournamentId = parseInt(req.params.id);
    if (!tournamentId) throw new ValidationError('Invalid tournament ID');

    const { reason } = req.body;

    const tournament = await rejectTournament(tournamentId, adminId, reason);
    res.json({ tournament, message: 'Tournament rejected successfully' });
  } catch (error) {
    next(error);
  }
};

// Clubs
export const listPendingClubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getPendingClubs(page, limit);

    res.json({
      clubs: result.clubs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveClubHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const clubId = parseInt(req.params.id);
    if (!clubId) throw new ValidationError('Invalid club ID');

    const club = await approveClub(clubId, adminId);
    res.json({ club, message: 'Club approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectClubHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const clubId = parseInt(req.params.id);
    if (!clubId) throw new ValidationError('Invalid club ID');

    const { reason } = req.body;

    const club = await rejectClub(clubId, adminId, reason);
    res.json({ club, message: 'Club rejected successfully' });
  } catch (error) {
    next(error);
  }
};

// Identity Verifications
export const listPendingVerifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getPendingIdentityVerifications(page, limit);

    res.json({
      verifications: result.verifications,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVerificationDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const verificationId = parseInt(req.params.id);
    if (!verificationId) throw new ValidationError('Invalid verification ID');

    const verification = await getIdentityVerificationById(verificationId);
    res.json(verification);
  } catch (error) {
    next(error);
  }
};

export const approveVerificationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const verificationId = parseInt(req.params.id);
    if (!verificationId) throw new ValidationError('Invalid verification ID');

    const { admin_notes } = req.body;

    const verification = await approveIdentityVerification(verificationId, adminId, admin_notes);
    res.json({ verification, message: 'Identity verification approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectVerificationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const verificationId = parseInt(req.params.id);
    if (!verificationId) throw new ValidationError('Invalid verification ID');

    const { reason, admin_notes } = req.body;
    if (!reason) throw new ValidationError('Rejection reason is required');

    const verification = await rejectIdentityVerification(verificationId, adminId, reason, admin_notes);
    res.json({ verification, message: 'Identity verification rejected' });
  } catch (error) {
    next(error);
  }
};

// Chess Title Verifications
export const listPendingChessTitleVerifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getPendingChessTitleVerifications(page, limit);

    res.json({
      verifications: result.verifications,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChessTitleVerificationDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const verificationId = parseInt(req.params.id);
    if (!verificationId) throw new ValidationError('Invalid verification ID');

    const verification = await getChessTitleVerificationById(verificationId);
    res.json(verification);
  } catch (error) {
    next(error);
  }
};

export const approveChessTitleVerificationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const verificationId = parseInt(req.params.id);
    if (!verificationId) throw new ValidationError('Invalid verification ID');

    const { admin_notes } = req.body;

    await approveChessTitleVerification(verificationId, adminId, admin_notes);
    res.json({ message: 'Chess title verification approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectChessTitleVerificationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('Admin not authenticated');

    const verificationId = parseInt(req.params.id);
    if (!verificationId) throw new ValidationError('Invalid verification ID');

    const { reason, admin_notes } = req.body;
    if (!reason) throw new ValidationError('Rejection reason is required');

    await rejectChessTitleVerification(verificationId, adminId, reason, admin_notes);
    res.json({ message: 'Chess title verification rejected' });
  } catch (error) {
    next(error);
  }
};
