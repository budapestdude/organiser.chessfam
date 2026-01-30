import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { generateAccessToken, generateRefreshToken } from '../config/jwt';
import { generateToken, emailConfig } from '../config/email';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from './emailService';
import { exchangeCodeForTokens, getGoogleUserProfile } from '../config/google';
import { User, UserResponse, AuthTokens, JWTPayload } from '../types';
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';
import { validateEmail, validatePassword, validateName, sanitizeInput } from '../utils/validators';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createUser = async (name: string, email: string, password: string): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  // Validate inputs
  validateName(name);
  validateEmail(email);
  validatePassword(password);

  // Sanitize inputs
  const sanitizedName = sanitizeInput(name);
  const sanitizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [sanitizedEmail]
  );

  if (existingUser.rows.length > 0) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate verification token
  const verificationToken = generateToken();
  const verificationExpires = new Date(Date.now() + emailConfig.verificationTokenExpiry);

  // Create user with verification token
  const result = await query(
    `INSERT INTO users (name, email, password_hash, rating, email_verified, email_verification_token, email_verification_expires, created_at, updated_at)
     VALUES ($1, $2, $3, $4, false, $5, $6, NOW(), NOW())
     RETURNING id, name, email, rating, avatar, created_at, is_admin, email_verified`,
    [sanitizedName, sanitizedEmail, passwordHash, 1500, verificationToken, verificationExpires]
  );

  const user = result.rows[0] as UserResponse;

  // Send verification email (non-blocking)
  sendVerificationEmail(sanitizedEmail, sanitizedName, verificationToken).catch(err => {
    console.error('Failed to send verification email:', err);
  });

  // Send welcome email (non-blocking)
  sendWelcomeEmail(sanitizedEmail, sanitizedName).catch(err => {
    console.error('Failed to send welcome email:', err);
  });

  // Generate tokens
  const payload: JWTPayload = { userId: user.id, email: user.email, is_admin: user.is_admin };
  const tokens: AuthTokens = {
    token: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };

  return { user, tokens };
};

export const authenticateUser = async (email: string, password: string): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  // Validate email format
  validateEmail(email);

  const sanitizedEmail = email.toLowerCase().trim();

  // Find user
  const result = await query(
    'SELECT id, name, email, password_hash, rating, avatar, created_at, is_admin, email_verified FROM users WHERE email = $1',
    [sanitizedEmail]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0] as User;

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const payload: JWTPayload = { userId: user.id, email: user.email, is_admin: user.is_admin };
  const tokens: AuthTokens = {
    token: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };

  // Return user without password_hash
  const { password_hash, email_verification_token, email_verification_expires, password_reset_token, password_reset_expires, ...userResponse } = user;

  return { user: userResponse as UserResponse, tokens };
};

export const getUserById = async (userId: number): Promise<UserResponse> => {
  const result = await query(
    'SELECT id, name, email, rating, avatar, created_at, is_admin, email_verified FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  return result.rows[0] as UserResponse;
};

// Email Verification
export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  if (!token) {
    throw new ValidationError('Verification token is required');
  }

  const result = await query(
    `UPDATE users
     SET email_verified = true,
         email_verification_token = NULL,
         email_verification_expires = NULL,
         updated_at = NOW()
     WHERE email_verification_token = $1
       AND email_verification_expires > NOW()
     RETURNING id, email`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new ValidationError('Invalid or expired verification token');
  }

  console.log(`[Auth] Email verified for user ${result.rows[0].email}`);
  return { message: 'Email verified successfully' };
};

export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
  validateEmail(email);
  const sanitizedEmail = email.toLowerCase().trim();

  // Find user
  const userResult = await query(
    'SELECT id, name, email, email_verified FROM users WHERE email = $1',
    [sanitizedEmail]
  );

  if (userResult.rows.length === 0) {
    // Don't reveal if user exists
    return { message: 'If the email exists, a verification link will be sent' };
  }

  const user = userResult.rows[0];

  if (user.email_verified) {
    throw new ValidationError('Email is already verified');
  }

  // Generate new token
  const verificationToken = generateToken();
  const verificationExpires = new Date(Date.now() + emailConfig.verificationTokenExpiry);

  await query(
    `UPDATE users
     SET email_verification_token = $1,
         email_verification_expires = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [verificationToken, verificationExpires, user.id]
  );

  // Send email
  await sendVerificationEmail(user.email, user.name, verificationToken);

  return { message: 'If the email exists, a verification link will be sent' };
};

// Password Reset
export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  validateEmail(email);
  const sanitizedEmail = email.toLowerCase().trim();

  // Find user
  const userResult = await query(
    'SELECT id, name, email FROM users WHERE email = $1',
    [sanitizedEmail]
  );

  // Always return success message to prevent email enumeration
  const successMessage = 'If the email exists, a password reset link will be sent';

  if (userResult.rows.length === 0) {
    return { message: successMessage };
  }

  const user = userResult.rows[0];

  // Generate reset token
  const resetToken = generateToken();
  const resetExpires = new Date(Date.now() + emailConfig.passwordResetTokenExpiry);

  await query(
    `UPDATE users
     SET password_reset_token = $1,
         password_reset_expires = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [resetToken, resetExpires, user.id]
  );

  // Send email
  await sendPasswordResetEmail(user.email, user.name, resetToken);

  return { message: successMessage };
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  if (!token) {
    throw new ValidationError('Reset token is required');
  }

  validatePassword(newPassword);

  // Find user with valid token
  const userResult = await query(
    `SELECT id FROM users
     WHERE password_reset_token = $1
       AND password_reset_expires > NOW()`,
    [token]
  );

  if (userResult.rows.length === 0) {
    throw new ValidationError('Invalid or expired reset token');
  }

  const userId = userResult.rows[0].id;

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password and clear reset token
  await query(
    `UPDATE users
     SET password_hash = $1,
         password_reset_token = NULL,
         password_reset_expires = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, userId]
  );

  console.log(`[Auth] Password reset for user ${userId}`);
  return { message: 'Password reset successfully' };
};

// Google OAuth Authentication
export const authenticateWithGoogle = async (code: string): Promise<{ user: UserResponse; tokens: AuthTokens }> => {
  // Exchange authorization code for tokens
  const googleTokens = await exchangeCodeForTokens(code);

  // Get user profile from Google
  const googleProfile = await getGoogleUserProfile(googleTokens.access_token);

  if (!googleProfile.email) {
    throw new ValidationError('Could not retrieve email from Google');
  }

  const sanitizedEmail = googleProfile.email.toLowerCase().trim();
  const sanitizedName = sanitizeInput(googleProfile.name || 'Google User');

  // Check if user exists by google_id or email
  const existingUserResult = await query(
    'SELECT id, name, email, rating, avatar, created_at, is_admin, email_verified, google_id, auth_provider, password_hash FROM users WHERE google_id = $1 OR email = $2',
    [googleProfile.id, sanitizedEmail]
  );

  let user: UserResponse;

  if (existingUserResult.rows.length > 0) {
    const existingUser = existingUserResult.rows[0];

    // User exists - update google_id if not set and link account
    if (!existingUser.google_id) {
      // Link Google account to existing user
      const newAuthProvider = existingUser.password_hash ? 'both' : 'google';
      await query(
        `UPDATE users
         SET google_id = $1,
             auth_provider = $2,
             email_verified = true,
             avatar = COALESCE(avatar, $3),
             updated_at = NOW()
         WHERE id = $4`,
        [googleProfile.id, newAuthProvider, googleProfile.picture, existingUser.id]
      );
      console.log(`[Auth] Linked Google account to existing user ${existingUser.email}`);
    }

    // Fetch updated user
    const updatedUserResult = await query(
      'SELECT id, name, email, rating, avatar, created_at, is_admin, email_verified FROM users WHERE id = $1',
      [existingUser.id]
    );
    user = updatedUserResult.rows[0] as UserResponse;
  } else {
    // Create new user with Google OAuth
    const result = await query(
      `INSERT INTO users (name, email, google_id, auth_provider, rating, avatar, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, 'google', 1500, $4, true, NOW(), NOW())
       RETURNING id, name, email, rating, avatar, created_at, is_admin, email_verified`,
      [sanitizedName, sanitizedEmail, googleProfile.id, googleProfile.picture]
    );
    user = result.rows[0] as UserResponse;
    console.log(`[Auth] Created new user via Google OAuth: ${sanitizedEmail}`);
  }

  // Generate JWT tokens
  const payload: JWTPayload = { userId: user.id, email: user.email, is_admin: user.is_admin };
  const tokens: AuthTokens = {
    token: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };

  return { user, tokens };
};
