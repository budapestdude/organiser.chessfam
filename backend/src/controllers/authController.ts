import { Request, Response, NextFunction } from 'express';
import {
  createUser,
  authenticateUser,
  getUserById,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  authenticateWithGoogle,
} from '../services/authService';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../config/jwt';
import { ValidationError } from '../utils/errors';
import { googleConfig, getGoogleAuthUrl } from '../config/google';

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

    // Fetch fresh user data to get current is_admin status
    const user = await getUserById(payload.userId);

    // Create clean payload without JWT metadata (exp, iat, etc.)
    const cleanPayload: { userId: number; email: string; is_admin?: boolean } = {
      userId: payload.userId,
      email: payload.email,
      is_admin: user.is_admin
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

// Email Verification
export const verifyEmailHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    const result = await verifyEmail(token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resendVerificationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const result = await resendVerificationEmail(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Password Reset
export const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const result = await requestPasswordReset(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new ValidationError('Token and new password are required');
    }

    const result = await resetPassword(token, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Debug endpoint to check Google OAuth configuration
export const googleAuthStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      isConfigured: googleConfig.isConfigured,
      hasClientId: !!googleConfig.clientId,
      hasClientSecret: !!googleConfig.clientSecret,
      callbackUrl: googleConfig.callbackUrl,
      frontendUrl: googleConfig.frontendUrl,
      clientIdPrefix: googleConfig.clientId ? googleConfig.clientId.substring(0, 20) + '...' : 'NOT_SET',
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth - Redirect to Google
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[Google OAuth] isConfigured:', googleConfig.isConfigured);
    console.log('[Google OAuth] clientId set:', !!googleConfig.clientId);
    console.log('[Google OAuth] clientSecret set:', !!googleConfig.clientSecret);

    if (!googleConfig.isConfigured) {
      throw new ValidationError('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    }

    const authUrl = getGoogleAuthUrl();
    console.log('[Google OAuth] Redirecting to:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

// Google OAuth - Handle callback
export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, error: oauthError } = req.query;

    if (oauthError) {
      // User denied access or other error
      return res.redirect(`${googleConfig.frontendUrl}/auth/callback?error=${encodeURIComponent(oauthError as string)}`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${googleConfig.frontendUrl}/auth/callback?error=no_code`);
    }

    const { user, tokens } = await authenticateWithGoogle(code);

    // Redirect to frontend callback with tokens
    const params = new URLSearchParams({
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      userId: user.id.toString(),
      name: user.name,
      email: user.email,
    });

    res.redirect(`${googleConfig.frontendUrl}/auth/callback?${params.toString()}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    res.redirect(`${googleConfig.frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`);
  }
};
