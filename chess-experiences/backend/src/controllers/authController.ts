import { Request, Response, NextFunction } from 'express';
import { createUser, authenticateUser, getUserById } from '../services/authService';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../config/jwt';
import { ValidationError } from '../utils/errors';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ValidationError('Name, email, and password are required');
    }

    const { user, tokens } = await createUser(name, email, password);

    res.status(201).json({
      user,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const { user, tokens } = await authenticateUser(email, password);

    res.status(200).json({
      user,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Create clean payload without JWT metadata (exp, iat, etc.)
    const cleanPayload: { userId: number; email: string } = {
      userId: payload.userId,
      email: payload.email
    };

    // Generate new tokens with clean payload
    const newAccessToken = generateAccessToken(cleanPayload);
    const newRefreshToken = generateRefreshToken(cleanPayload);

    res.status(200).json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await getUserById(req.user.userId);

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a more advanced implementation, you would invalidate the refresh token here
    // For now, we'll just return success (client will remove tokens)
    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
