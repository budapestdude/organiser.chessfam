import { Request, Response } from 'express';
import pool from '../config/database';
import type { CreateTournamentRegistrationRequest } from '../types/tournament';

export const registerForTournament = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = user.userId;
    const {
      tournament_id,
      player_name,
      player_rating,
      player_email,
      player_phone,
      entry_fee,
      notes
    }: CreateTournamentRegistrationRequest = req.body;

    // Validate required fields
    if (!tournament_id || !player_name || !player_email || entry_fee === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tournament ID, player name, email, and entry fee are required'
      });
    }

    // Create registration (auto-confirmed in Phase 1)
    const result = await pool.query(
      `INSERT INTO tournament_registrations (
        user_id, tournament_id, player_name, player_rating, player_email,
        player_phone, entry_fee, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed')
      RETURNING *`,
      [
        userId, tournament_id, player_name, player_rating, player_email,
        player_phone, entry_fee, notes
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Registration confirmed',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error registering for tournament:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register for tournament'
    });
  }
};

export const getUserTournamentRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT
        tr.*
      FROM tournament_registrations tr
      WHERE tr.user_id = $1
      ORDER BY tr.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching tournament registrations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch registrations'
    });
  }
};

export const getTournamentRegistrationById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        tr.*
      FROM tournament_registrations tr
      WHERE tr.id = $1 AND tr.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching registration:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch registration'
    });
  }
};
