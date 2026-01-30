import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { generateAccessToken, generateRefreshToken } from '../config/jwt';
import { User, UserResponse, AuthTokens, JWTPayload } from '../types';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';
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

  // Create user
  const result = await query(
    `INSERT INTO users (name, email, password_hash, rating, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, name, email, rating, avatar, created_at, is_admin`,
    [sanitizedName, sanitizedEmail, passwordHash, 1500]
  );

  const user = result.rows[0] as UserResponse;

  // Generate tokens
  const payload: JWTPayload = { userId: user.id, email: user.email };
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
    'SELECT id, name, email, password_hash, rating, avatar, created_at, is_admin FROM users WHERE email = $1',
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
  const payload: JWTPayload = { userId: user.id, email: user.email };
  const tokens: AuthTokens = {
    token: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };

  // Return user without password_hash
  const { password_hash, ...userResponse } = user;

  return { user: userResponse as UserResponse, tokens };
};

export const getUserById = async (userId: number): Promise<UserResponse> => {
  const result = await query(
    'SELECT id, name, email, rating, avatar, created_at, is_admin FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  return result.rows[0] as UserResponse;
};
