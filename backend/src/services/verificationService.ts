import { query } from '../config/database';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';

export interface VerificationSubmission {
  full_name: string;
  date_of_birth: string;
  country: string;
  id_type: 'passport' | 'drivers_license' | 'national_id';
  id_number?: string;
  id_front_image: string; // Base64 or URL
  id_back_image?: string; // Base64 or URL
  selfie_image: string; // Base64 or URL
}

// Check if user already has a pending verification
export const hasPendingVerification = async (userId: number): Promise<boolean> => {
  const result = await query(
    `SELECT id FROM identity_verifications
     WHERE user_id = $1 AND status = 'pending'`,
    [userId]
  );
  return result.rows.length > 0;
};

// Check if user is verified
export const isUserVerified = async (userId: number): Promise<boolean> => {
  const result = await query(
    `SELECT identity_verified FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows.length > 0 && result.rows[0].identity_verified === true;
};

// Submit verification request
export const submitVerification = async (
  userId: number,
  data: VerificationSubmission
): Promise<any> => {
  const {
    full_name,
    date_of_birth,
    country,
    id_type,
    id_number,
    id_front_image,
    id_back_image,
    selfie_image,
  } = data;

  // Validate required fields
  if (!full_name || !date_of_birth || !country || !id_type || !id_front_image || !selfie_image) {
    throw new ValidationError('Missing required verification fields');
  }

  // Check if user already has a pending verification
  const hasPending = await hasPendingVerification(userId);
  if (hasPending) {
    throw new ValidationError('You already have a pending verification request');
  }

  // Check if user is already verified
  const isVerified = await isUserVerified(userId);
  if (isVerified) {
    throw new ValidationError('Your identity is already verified');
  }

  // Insert verification request
  const result = await query(
    `INSERT INTO identity_verifications (
      user_id, full_name, date_of_birth, country, id_type, id_number,
      id_front_image, id_back_image, selfie_image, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *`,
    [
      userId,
      full_name,
      date_of_birth,
      country,
      id_type,
      id_number || null,
      id_front_image,
      id_back_image || null,
      selfie_image,
    ]
  );

  console.log(`[Verification] User ${userId} submitted verification request`);

  return result.rows[0];
};

// Get user's verification status
export const getUserVerificationStatus = async (userId: number): Promise<any> => {
  // Get user's verified status
  const userResult = await query(
    `SELECT identity_verified, identity_verified_at FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  // Get latest verification submission
  const verificationResult = await query(
    `SELECT id, status, created_at, reviewed_at, rejection_reason
     FROM identity_verifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return {
    identity_verified: user.identity_verified,
    verified_at: user.identity_verified_at,
    latest_submission: verificationResult.rows.length > 0 ? verificationResult.rows[0] : null,
  };
};

// Admin: Get pending verifications
export const getPendingVerifications = async (
  page: number = 1,
  limit: number = 50
): Promise<{ verifications: any[]; total: number }> => {
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

// Admin: Get verification by ID
export const getVerificationById = async (verificationId: number): Promise<any> => {
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

// Admin: Approve verification
export const approveVerification = async (
  verificationId: number,
  adminId: number,
  adminNotes?: string
): Promise<any> => {
  // First get the verification with user info
  const verificationResult = await query(
    `SELECT iv.*, u.email, u.name
     FROM identity_verifications iv
     JOIN users u ON iv.user_id = u.id
     WHERE iv.id = $1`,
    [verificationId]
  );

  if (verificationResult.rows.length === 0) {
    throw new NotFoundError('Verification request not found');
  }

  const verification = verificationResult.rows[0];

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

  console.log(`[Admin] Verification ${verificationId} approved by admin ${adminId}`);

  // Send approval email (non-blocking)
  const { sendVerificationApproved } = await import('./emailService');
  sendVerificationApproved(verification.email, verification.name).catch(err => {
    console.error('Failed to send verification approved email:', err);
  });

  // Trigger will automatically update users table
  return result.rows[0];
};

// Admin: Reject verification
export const rejectVerification = async (
  verificationId: number,
  adminId: number,
  reason: string,
  adminNotes?: string
): Promise<any> => {
  if (!reason) {
    throw new ValidationError('Rejection reason is required');
  }

  // First get the verification with user info
  const verificationResult = await query(
    `SELECT iv.*, u.email, u.name
     FROM identity_verifications iv
     JOIN users u ON iv.user_id = u.id
     WHERE iv.id = $1`,
    [verificationId]
  );

  if (verificationResult.rows.length === 0) {
    throw new NotFoundError('Verification request not found');
  }

  const verification = verificationResult.rows[0];

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

  console.log(`[Admin] Verification ${verificationId} rejected by admin ${adminId}. Reason: ${reason}`);

  // Send rejection email (non-blocking)
  const { sendVerificationRejected } = await import('./emailService');
  sendVerificationRejected(verification.email, verification.name, reason).catch(err => {
    console.error('Failed to send verification rejected email:', err);
  });

  return result.rows[0];
};

// Middleware helper: Require verified identity
export const requireVerification = async (userId: number): Promise<void> => {
  const isVerified = await isUserVerified(userId);
  if (!isVerified) {
    throw new ForbiddenError('Identity verification required to perform this action');
  }
};

// Admin: Directly verify a user (without application)
export const directlyVerifyUser = async (
  userId: number,
  adminId: number,
  reason?: string
): Promise<void> => {
  // Check if user exists
  const userResult = await query(
    `SELECT id, identity_verified FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  if (user.identity_verified) {
    throw new ValidationError('User is already verified');
  }

  // Update user's verification status directly
  await query(
    `UPDATE users
     SET identity_verified = TRUE,
         identity_verified_at = NOW()
     WHERE id = $1`,
    [userId]
  );

  // Create a record in identity_verifications for audit trail
  await query(
    `INSERT INTO identity_verifications (
      user_id, full_name, date_of_birth, country, id_type, id_front_image, selfie_image,
      status, reviewed_by, reviewed_at, admin_notes
    ) VALUES (
      $1,
      (SELECT name FROM users WHERE id = $1),
      '1900-01-01',
      'N/A',
      'admin_verified',
      'admin_verified',
      'admin_verified',
      'approved',
      $2,
      NOW(),
      $3
    )`,
    [userId, adminId, reason || 'Directly verified by admin']
  );

  console.log(`[Admin] User ${userId} directly verified by admin ${adminId}. Reason: ${reason || 'N/A'}`);
};

// Admin: Revoke user verification
export const revokeVerification = async (
  userId: number,
  adminId: number,
  reason: string
): Promise<void> => {
  if (!reason) {
    throw new ValidationError('Revocation reason is required');
  }

  // Check if user exists and is verified
  const userResult = await query(
    `SELECT id, identity_verified FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  if (!user.identity_verified) {
    throw new ValidationError('User is not currently verified');
  }

  // Revoke verification
  await query(
    `UPDATE users
     SET identity_verified = FALSE,
         identity_verified_at = NULL
     WHERE id = $1`,
    [userId]
  );

  // Create audit log entry
  await query(
    `INSERT INTO identity_verifications (
      user_id, full_name, status, reviewed_by, reviewed_at, admin_notes, rejection_reason
    ) VALUES ($1, (SELECT name FROM users WHERE id = $1), 'revoked', $2, NOW(), 'Verification revoked by admin', $3)`,
    [userId, adminId, reason]
  );

  console.log(`[Admin] User ${userId} verification revoked by admin ${adminId}. Reason: ${reason}`);
};
