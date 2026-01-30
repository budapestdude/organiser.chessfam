import { Request, Response } from 'express';
import pool from '../config/database';
import type { CreateClubMembershipRequest } from '../types/club';

export const joinClub = async (req: Request, res: Response) => {
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
      club_id,
      member_name,
      member_rating,
      member_email,
      member_phone,
      membership_fee,
      membership_type,
      notes
    }: CreateClubMembershipRequest = req.body;

    // Validate required fields
    if (!club_id || !member_name || !member_email || membership_fee === undefined || !membership_type) {
      return res.status(400).json({
        success: false,
        message: 'Club ID, member name, email, membership fee, and type are required'
      });
    }

    // Create membership (auto-active in Phase 1)
    const result = await pool.query(
      `INSERT INTO club_memberships (
        user_id, club_id, member_name, member_rating, member_email,
        member_phone, membership_fee, membership_type, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING *`,
      [
        userId, club_id, member_name, member_rating, member_email,
        member_phone, membership_fee, membership_type, notes
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Membership activated',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error joining club:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to join club'
    });
  }
};

export const getUserClubMemberships = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT
        cm.*
      FROM club_memberships cm
      WHERE cm.user_id = $1
      ORDER BY cm.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching club memberships:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch memberships'
    });
  }
};

export const getClubMembershipById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        cm.*
      FROM club_memberships cm
      WHERE cm.id = $1 AND cm.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching membership:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch membership'
    });
  }
};
