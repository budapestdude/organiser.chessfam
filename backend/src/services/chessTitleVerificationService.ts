import { query } from '../config/database';
import { sendChessTitleVerificationApproved, sendChessTitleVerificationRejected } from './emailService';

// FIDE titles that can be verified
const VALID_FIDE_TITLES = ['GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'];

// Max certificate image size (5MB in base64 ~ 6.7MB)
const MAX_CERTIFICATE_SIZE = 7000000; // 7MB to account for base64 encoding overhead

export interface ChessTitleVerificationSubmission {
  claimed_title: string;
  fide_id?: string;
  certificate_image: string;
}

export interface ChessTitleVerification {
  id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  claimed_title: string;
  fide_id?: string;
  certificate_image: string;
  reviewed_by?: number;
  reviewed_at?: Date;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChessTitleVerificationStatus {
  chess_title_verified: boolean;
  chess_title_verified_at?: Date;
  chess_title_verified_by?: number;
  latest_submission?: ChessTitleVerification;
}

/**
 * Submit a chess title verification request
 */
export const submitTitleVerification = async (
  userId: number,
  data: ChessTitleVerificationSubmission
): Promise<ChessTitleVerification> => {
  // Validate title is a FIDE title
  if (!VALID_FIDE_TITLES.includes(data.claimed_title)) {
    throw new Error(`Invalid title. Only FIDE titles can be verified: ${VALID_FIDE_TITLES.join(', ')}`);
  }

  // Validate certificate image
  if (!data.certificate_image) {
    throw new Error('Certificate image is required');
  }

  // Check certificate size
  if (data.certificate_image.length > MAX_CERTIFICATE_SIZE) {
    throw new Error('Certificate image is too large. Maximum size is 5MB');
  }

  // Check for existing pending verification
  const existingPending = await hasPendingTitleVerification(userId);
  if (existingPending) {
    throw new Error('You already have a pending chess title verification. Please wait for admin review.');
  }

  // Create verification submission
  const result = await query(
    `INSERT INTO chess_title_verifications
     (user_id, claimed_title, fide_id, certificate_image, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [userId, data.claimed_title, data.fide_id || null, data.certificate_image]
  );

  return result.rows[0];
};

/**
 * Get user's chess title verification status
 */
export const getUserTitleVerificationStatus = async (
  userId: number
): Promise<ChessTitleVerificationStatus> => {
  // Get user's verification status
  const userResult = await query(
    `SELECT chess_title_verified, chess_title_verified_at, chess_title_verified_by
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const userStatus = userResult.rows[0];

  // Get latest submission
  const submissionResult = await query(
    `SELECT * FROM chess_title_verifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return {
    chess_title_verified: userStatus.chess_title_verified,
    chess_title_verified_at: userStatus.chess_title_verified_at,
    chess_title_verified_by: userStatus.chess_title_verified_by,
    latest_submission: submissionResult.rows[0] || undefined,
  };
};

/**
 * Check if user has a pending title verification
 */
export const hasPendingTitleVerification = async (userId: number): Promise<boolean> => {
  const result = await query(
    `SELECT id FROM chess_title_verifications
     WHERE user_id = $1 AND status = 'pending'
     LIMIT 1`,
    [userId]
  );

  return result.rows.length > 0;
};

/**
 * Check if user's title is verified
 */
export const isUserTitleVerified = async (userId: number): Promise<boolean> => {
  const result = await query(
    `SELECT chess_title_verified FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  return result.rows[0].chess_title_verified;
};

/**
 * Get pending chess title verifications (admin)
 */
export const getPendingTitleVerifications = async (
  page: number = 1,
  limit: number = 20
): Promise<{ verifications: any[]; total: number; totalPages: number }> => {
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM chess_title_verifications WHERE status = 'pending'`
  );
  const total = parseInt(countResult.rows[0].count);

  // Get verifications with user info
  const result = await query(
    `SELECT
       ctv.*,
       u.email as user_email,
       u.name as user_name,
       u.chess_title as current_chess_title,
       u.chess_title_verified as current_title_verified
     FROM chess_title_verifications ctv
     JOIN users u ON ctv.user_id = u.id
     WHERE ctv.status = 'pending'
     ORDER BY ctv.created_at ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    verifications: result.rows,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get chess title verification by ID (admin)
 */
export const getTitleVerificationById = async (id: number): Promise<any> => {
  const result = await query(
    `SELECT
       ctv.*,
       u.email as user_email,
       u.name as user_name,
       u.chess_title as current_chess_title,
       u.chess_title_verified as current_title_verified,
       reviewer.name as reviewer_name
     FROM chess_title_verifications ctv
     JOIN users u ON ctv.user_id = u.id
     LEFT JOIN users reviewer ON ctv.reviewed_by = reviewer.id
     WHERE ctv.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Chess title verification not found');
  }

  return result.rows[0];
};

/**
 * Approve chess title verification (admin)
 */
export const approveTitleVerification = async (
  id: number,
  adminId: number,
  adminNotes?: string
): Promise<void> => {
  // Get verification details
  const verification = await getTitleVerificationById(id);

  if (verification.status !== 'pending') {
    throw new Error('Only pending verifications can be approved');
  }

  // Update verification status
  await query(
    `UPDATE chess_title_verifications
     SET status = 'approved',
         reviewed_by = $1,
         reviewed_at = NOW(),
         admin_notes = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [adminId, adminNotes || null, id]
  );

  // Send approval email
  try {
    await sendChessTitleVerificationApproved(
      verification.user_email,
      verification.user_name,
      verification.claimed_title
    );
  } catch (error) {
    console.error('Failed to send approval email:', error);
    // Don't throw - approval was successful even if email fails
  }
};

/**
 * Reject chess title verification (admin)
 */
export const rejectTitleVerification = async (
  id: number,
  adminId: number,
  reason: string,
  adminNotes?: string
): Promise<void> => {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }

  // Get verification details
  const verification = await getTitleVerificationById(id);

  if (verification.status !== 'pending') {
    throw new Error('Only pending verifications can be rejected');
  }

  // Update verification status
  await query(
    `UPDATE chess_title_verifications
     SET status = 'rejected',
         reviewed_by = $1,
         reviewed_at = NOW(),
         rejection_reason = $2,
         admin_notes = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [adminId, reason, adminNotes || null, id]
  );

  // Send rejection email
  try {
    await sendChessTitleVerificationRejected(
      verification.user_email,
      verification.user_name,
      reason
    );
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    // Don't throw - rejection was successful even if email fails
  }
};

/**
 * Directly verify user's chess title without application (admin)
 */
export const directlyVerifyUserTitle = async (
  userId: number,
  adminId: number,
  title: string,
  reason?: string
): Promise<void> => {
  // Validate title
  if (!VALID_FIDE_TITLES.includes(title)) {
    throw new Error(`Invalid title. Only FIDE titles can be verified: ${VALID_FIDE_TITLES.join(', ')}`);
  }

  // Check if user exists
  const userResult = await query(`SELECT id, email, name FROM users WHERE id = $1`, [userId]);
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Create an approved verification record
  await query(
    `INSERT INTO chess_title_verifications
     (user_id, claimed_title, certificate_image, status, reviewed_by, reviewed_at, admin_notes)
     VALUES ($1, $2, $3, 'approved', $4, NOW(), $5)`,
    [
      userId,
      title,
      'direct_verification', // Placeholder since certificate not required for direct verification
      adminId,
      reason || 'Direct verification by admin',
    ]
  );

  // Update user's chess title and verification status
  await query(
    `UPDATE users
     SET chess_title = $1,
         chess_title_verified = TRUE,
         chess_title_verified_at = NOW(),
         chess_title_verified_by = $2
     WHERE id = $3`,
    [title, adminId, userId]
  );

  // Send approval email
  try {
    await sendChessTitleVerificationApproved(user.email, user.name, title);
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }
};

/**
 * Revoke user's chess title verification (admin)
 */
export const revokeUserTitleVerification = async (
  userId: number,
  adminId: number,
  reason?: string
): Promise<void> => {
  // Check if user exists and is verified
  const userResult = await query(
    `SELECT id, email, name, chess_title_verified FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  if (!user.chess_title_verified) {
    throw new Error('User does not have a verified chess title');
  }

  // Mark latest approved verification as revoked
  await query(
    `UPDATE chess_title_verifications
     SET status = 'revoked',
         admin_notes = $1,
         updated_at = NOW()
     WHERE user_id = $2 AND status = 'approved'`,
    [reason || 'Revoked by admin', userId]
  );

  // Update user's verification status
  await query(
    `UPDATE users
     SET chess_title_verified = FALSE,
         chess_title_verified_at = NULL,
         chess_title_verified_by = NULL
     WHERE id = $1`,
    [userId]
  );

  // Send revocation email (using rejection template with custom message)
  try {
    await sendChessTitleVerificationRejected(
      user.email,
      user.name,
      reason || 'Your chess title verification has been revoked by an administrator.'
    );
  } catch (error) {
    console.error('Failed to send revocation email:', error);
  }
};
