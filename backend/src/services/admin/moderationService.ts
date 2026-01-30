import { query } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import * as chessTitleVerificationService from '../chessTitleVerificationService';

export interface Review {
  id: number;
  type: 'player' | 'venue' | 'club' | 'tournament';
  reviewer_id: number;
  reviewer_name: string;
  target_id: number;
  target_name: string;
  rating: number;
  content: string;
  created_at: Date;
}

export interface GetReviewsParams {
  type?: 'player' | 'venue' | 'club' | 'tournament' | 'all';
  page?: number;
  limit?: number;
}

export const getReviews = async (params: GetReviewsParams = {}): Promise<{ reviews: Review[]; total: number }> => {
  const { type = 'all', page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  // Get reviews from all review tables
  const reviews: Review[] = [];
  let total = 0;

  if (type === 'all' || type === 'player') {
    const playerReviews = await query(
      `SELECT pr.id, 'player' as type, pr.reviewer_id, r.name as reviewer_name,
              pr.reviewed_id as target_id, t.name as target_name,
              pr.rating, pr.content, pr.created_at
       FROM player_reviews pr
       JOIN users r ON pr.reviewer_id = r.id
       JOIN users t ON pr.reviewed_id = t.id
       ORDER BY pr.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    reviews.push(...playerReviews.rows);

    const countResult = await query('SELECT COUNT(*) FROM player_reviews');
    total += parseInt(countResult.rows[0].count, 10);
  }

  if (type === 'all' || type === 'venue') {
    const venueReviews = await query(
      `SELECT vr.id, 'venue' as type, vr.reviewer_id, u.name as reviewer_name,
              vr.venue_id as target_id, v.venue_name as target_name,
              vr.rating, vr.review_text as content, vr.created_at
       FROM venue_reviews vr
       JOIN users u ON vr.reviewer_id = u.id
       JOIN venue_submissions v ON vr.venue_id = v.id
       ORDER BY vr.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    reviews.push(...venueReviews.rows);

    const countResult = await query('SELECT COUNT(*) FROM venue_reviews');
    total += parseInt(countResult.rows[0].count, 10);
  }

  if (type === 'all' || type === 'club') {
    const clubReviews = await query(
      `SELECT cr.id, 'club' as type, cr.user_id as reviewer_id, u.name as reviewer_name,
              cr.club_id as target_id, c.name as target_name,
              cr.rating, cr.content, cr.created_at
       FROM club_reviews cr
       JOIN users u ON cr.user_id = u.id
       JOIN clubs c ON cr.club_id = c.id
       ORDER BY cr.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    reviews.push(...clubReviews.rows);

    const countResult = await query('SELECT COUNT(*) FROM club_reviews');
    total += parseInt(countResult.rows[0].count, 10);
  }

  if (type === 'all' || type === 'tournament') {
    const tournamentReviews = await query(
      `SELECT tr.id, 'tournament' as type, tr.user_id as reviewer_id, u.name as reviewer_name,
              tr.tournament_id as target_id, t.name as target_name,
              tr.rating, tr.content, tr.created_at
       FROM tournament_reviews tr
       JOIN users u ON tr.user_id = u.id
       JOIN tournaments t ON tr.tournament_id = t.id
       ORDER BY tr.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    reviews.push(...tournamentReviews.rows);

    const countResult = await query('SELECT COUNT(*) FROM tournament_reviews');
    total += parseInt(countResult.rows[0].count, 10);
  }

  // Sort all reviews by date
  reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { reviews: reviews.slice(0, limit), total };
};

export const deleteReview = async (reviewType: string, reviewId: number, adminId: number): Promise<void> => {
  let tableName: string;

  switch (reviewType) {
    case 'player':
      tableName = 'player_reviews';
      break;
    case 'venue':
      tableName = 'venue_reviews';
      break;
    case 'club':
      tableName = 'club_reviews';
      break;
    case 'tournament':
      tableName = 'tournament_reviews';
      break;
    default:
      throw new NotFoundError('Invalid review type');
  }

  const result = await query(
    `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`,
    [reviewId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  console.log(`[Admin] ${reviewType} review ${reviewId} deleted by admin ${adminId}`);
};

// Venue management
export const getPendingVenues = async (page: number = 1, limit: number = 50): Promise<{ venues: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [venuesResult, countResult] = await Promise.all([
    query(
      `SELECT vs.*, u.name as submitted_by_name
       FROM venue_submissions vs
       LEFT JOIN users u ON vs.user_id = u.id
       WHERE vs.status = 'pending'
       ORDER BY vs.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query(`SELECT COUNT(*) FROM venue_submissions WHERE status = 'pending'`),
  ]);

  return {
    venues: venuesResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

export const approveVenue = async (venueId: number, adminId: number): Promise<any> => {
  const result = await query(
    `UPDATE venue_submissions
     SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [adminId, venueId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Venue not found');
  }

  console.log(`[Admin] Venue ${venueId} approved by admin ${adminId}`);

  return result.rows[0];
};

export const rejectVenue = async (venueId: number, adminId: number, reason?: string): Promise<any> => {
  const result = await query(
    `UPDATE venue_submissions
     SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $3
     WHERE id = $2
     RETURNING *`,
    [adminId, venueId, reason]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Venue not found');
  }

  console.log(`[Admin] Venue ${venueId} rejected by admin ${adminId}. Reason: ${reason}`);

  return result.rows[0];
};

// Master applications management
export const getPendingMasterApplications = async (page: number = 1, limit: number = 50): Promise<{ applications: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [applicationsResult, countResult] = await Promise.all([
    query(
      `SELECT ma.*, u.name, u.email, u.rating, u.avatar
       FROM master_applications ma
       JOIN users u ON ma.user_id = u.id
       WHERE ma.status = 'pending'
       ORDER BY ma.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query(`SELECT COUNT(*) FROM master_applications WHERE status = 'pending'`),
  ]);

  return {
    applications: applicationsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

export const approveMasterApplication = async (applicationId: number, adminId: number): Promise<any> => {
  const result = await query(
    `UPDATE master_applications
     SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [adminId, applicationId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Application not found');
  }

  console.log(`[Admin] Master application ${applicationId} approved by admin ${adminId}`);

  return result.rows[0];
};

export const rejectMasterApplication = async (applicationId: number, adminId: number, reason?: string): Promise<any> => {
  const result = await query(
    `UPDATE master_applications
     SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $3
     WHERE id = $2
     RETURNING *`,
    [adminId, applicationId, reason]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Application not found');
  }

  console.log(`[Admin] Master application ${applicationId} rejected by admin ${adminId}. Reason: ${reason}`);

  return result.rows[0];
};

// Ownership claims management
export const getPendingOwnershipClaims = async (page: number = 1, limit: number = 50): Promise<{ claims: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [claimsResult, countResult] = await Promise.all([
    query(
      `SELECT oc.*, u.name as claimer_name, u.email as claimer_email
       FROM ownership_claims oc
       JOIN users u ON oc.claimer_id = u.id
       WHERE oc.status = 'pending'
       ORDER BY oc.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query(`SELECT COUNT(*) FROM ownership_claims WHERE status = 'pending'`),
  ]);

  return {
    claims: claimsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

export const approveOwnershipClaim = async (claimId: number, adminId: number): Promise<any> => {
  const result = await query(
    `UPDATE ownership_claims
     SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [adminId, claimId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Claim not found');
  }

  // Update the entity ownership
  const claim = result.rows[0];

  // Determine the table based on entity_type
  let ownerColumn = 'user_id';
  let tableName: string;

  switch (claim.entity_type) {
    case 'venue':
      tableName = 'venue_submissions';
      break;
    case 'club':
      tableName = 'clubs';
      ownerColumn = 'owner_id';
      break;
    case 'tournament':
      tableName = 'tournaments';
      ownerColumn = 'organizer_id';
      break;
    case 'community':
      tableName = 'communities';
      ownerColumn = 'owner_id';
      break;
    default:
      throw new NotFoundError('Invalid entity type');
  }

  await query(
    `UPDATE ${tableName}
     SET ${ownerColumn} = $1, claimed_at = NOW(), is_claimable = false
     WHERE id = $2`,
    [claim.claimer_id, claim.entity_id]
  );

  // Record in ownership_transfers
  await query(
    `INSERT INTO ownership_transfers (entity_type, entity_id, to_user_id, transfer_type, transferred_by)
     VALUES ($1, $2, $3, 'claim', $4)`,
    [claim.entity_type, claim.entity_id, claim.claimer_id, adminId]
  );

  console.log(`[Admin] Ownership claim ${claimId} approved by admin ${adminId}`);

  return result.rows[0];
};

export const rejectOwnershipClaim = async (claimId: number, adminId: number, reason?: string): Promise<any> => {
  const result = await query(
    `UPDATE ownership_claims
     SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), review_notes = $3
     WHERE id = $2
     RETURNING *`,
    [adminId, claimId, reason]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Claim not found');
  }

  console.log(`[Admin] Ownership claim ${claimId} rejected by admin ${adminId}. Reason: ${reason}`);

  return result.rows[0];
};

// Tournament approval management
export const getPendingTournaments = async (page: number = 1, limit: number = 50): Promise<{ tournaments: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [tournamentsResult, countResult] = await Promise.all([
    query(
      `SELECT t.*, u.name as organizer_name, u.email as organizer_email
       FROM tournaments t
       JOIN users u ON t.organizer_id = u.id
       WHERE t.approval_status = 'pending'
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query(`SELECT COUNT(*) FROM tournaments WHERE approval_status = 'pending'`),
  ]);

  return {
    tournaments: tournamentsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

export const approveTournament = async (tournamentId: number, adminId: number): Promise<any> => {
  const result = await query(
    `UPDATE tournaments
     SET approval_status = 'approved', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [adminId, tournamentId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Tournament not found');
  }

  console.log(`[Admin] Tournament ${tournamentId} approved by admin ${adminId}`);

  return result.rows[0];
};

export const rejectTournament = async (tournamentId: number, adminId: number, reason?: string): Promise<any> => {
  const result = await query(
    `UPDATE tournaments
     SET approval_status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $3
     WHERE id = $2
     RETURNING *`,
    [adminId, tournamentId, reason]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Tournament not found');
  }

  console.log(`[Admin] Tournament ${tournamentId} rejected by admin ${adminId}. Reason: ${reason}`);

  return result.rows[0];
};

// Club approval management
export const getPendingClubs = async (page: number = 1, limit: number = 50): Promise<{ clubs: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [clubsResult, countResult] = await Promise.all([
    query(
      `SELECT c.*, u.name as owner_name, u.email as owner_email
       FROM clubs c
       JOIN users u ON c.owner_id = u.id
       WHERE c.approval_status = 'pending'
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query(`SELECT COUNT(*) FROM clubs WHERE approval_status = 'pending'`),
  ]);

  return {
    clubs: clubsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

export const approveClub = async (clubId: number, adminId: number): Promise<any> => {
  const result = await query(
    `UPDATE clubs
     SET approval_status = 'approved', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [adminId, clubId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Club not found');
  }

  console.log(`[Admin] Club ${clubId} approved by admin ${adminId}`);

  return result.rows[0];
};

export const rejectClub = async (clubId: number, adminId: number, reason?: string): Promise<any> => {
  const result = await query(
    `UPDATE clubs
     SET approval_status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $3
     WHERE id = $2
     RETURNING *`,
    [adminId, clubId, reason]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Club not found');
  }

  console.log(`[Admin] Club ${clubId} rejected by admin ${adminId}. Reason: ${reason}`);

  return result.rows[0];
};

// Identity verification management
export const getPendingIdentityVerifications = async (page: number = 1, limit: number = 50): Promise<{ verifications: any[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [verificationsResult, countResult] = await Promise.all([
    query(
      `SELECT iv.*, u.name, u.email, u.rating, u.avatar
       FROM identity_verifications iv
       JOIN users u ON iv.user_id = u.id
       WHERE iv.status = 'pending'
       ORDER BY iv.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query(`SELECT COUNT(*) FROM identity_verifications WHERE status = 'pending'`),
  ]);

  return {
    verifications: verificationsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

export const getIdentityVerificationById = async (verificationId: number): Promise<any> => {
  const result = await query(
    `SELECT iv.*, u.name, u.email, u.rating, u.avatar
     FROM identity_verifications iv
     JOIN users u ON iv.user_id = u.id
     WHERE iv.id = $1`,
    [verificationId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Verification request not found');
  }

  return result.rows[0];
};

export const approveIdentityVerification = async (verificationId: number, adminId: number, adminNotes?: string): Promise<any> => {
  const result = await query(
    `UPDATE identity_verifications
     SET status = 'approved',
         reviewed_by = $1,
         reviewed_at = NOW(),
         admin_notes = $3
     WHERE id = $2
     RETURNING *`,
    [adminId, verificationId, adminNotes || null]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Verification request not found');
  }

  console.log(`[Admin] Identity verification ${verificationId} approved by admin ${adminId}`);

  return result.rows[0];
};

export const rejectIdentityVerification = async (verificationId: number, adminId: number, reason: string, adminNotes?: string): Promise<any> => {
  const result = await query(
    `UPDATE identity_verifications
     SET status = 'rejected',
         reviewed_by = $1,
         reviewed_at = NOW(),
         rejection_reason = $3,
         admin_notes = $4
     WHERE id = $2
     RETURNING *`,
    [adminId, verificationId, reason, adminNotes || null]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Verification request not found');
  }

  console.log(`[Admin] Identity verification ${verificationId} rejected by admin ${adminId}. Reason: ${reason}`);

  return result.rows[0];
};

// Chess title verification management
export const getPendingChessTitleVerifications = async (page: number = 1, limit: number = 20): Promise<{ verifications: any[]; total: number; totalPages: number }> => {
  return await chessTitleVerificationService.getPendingTitleVerifications(page, limit);
};

export const getChessTitleVerificationById = async (id: number): Promise<any> => {
  return await chessTitleVerificationService.getTitleVerificationById(id);
};

export const approveChessTitleVerification = async (id: number, adminId: number, adminNotes?: string): Promise<void> => {
  await chessTitleVerificationService.approveTitleVerification(id, adminId, adminNotes);
  console.log(`[Admin] Chess title verification ${id} approved by admin ${adminId}`);
};

export const rejectChessTitleVerification = async (id: number, adminId: number, reason: string, adminNotes?: string): Promise<void> => {
  await chessTitleVerificationService.rejectTitleVerification(id, adminId, reason, adminNotes);
  console.log(`[Admin] Chess title verification ${id} rejected by admin ${adminId}. Reason: ${reason}`);
};
