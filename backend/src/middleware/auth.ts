import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import pool from '../config/database';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyAccessToken(token);
    (req as any).user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired token'
    });
  }
};

// Alias for compatibility
export const authenticate = authenticateToken;

// Optional authentication - continues even if no token or invalid token
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      (req as any).user = decoded;
    }
  } catch (error) {
    // Silently ignore invalid tokens for optional auth
  }
  next();
};

// Verify tournament ownership
export const verifyTournamentOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (isNaN(tournamentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tournament ID'
      });
    }

    const result = await pool.query(
      'SELECT organizer_id FROM tournaments WHERE id = $1',
      [tournamentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (result.rows[0].organizer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this tournament'
      });
    }

    next();
  } catch (error: any) {
    console.error('Error verifying tournament ownership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify ownership',
      error: error.message
    });
  }
};

// Verify club ownership
export const verifyClubOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clubId = parseInt(req.params.id);
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (isNaN(clubId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid club ID'
      });
    }

    const result = await pool.query(
      'SELECT owner_id FROM clubs WHERE id = $1',
      [clubId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    if (result.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this club'
      });
    }

    next();
  } catch (error: any) {
    console.error('Error verifying club ownership:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify ownership',
      error: error.message
    });
  }
};
