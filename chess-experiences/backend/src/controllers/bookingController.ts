import { Request, Response } from 'express';
import pool from '../config/database';
import type { CreateBookingRequest } from '../types/booking';

export const createBooking = async (req: Request, res: Response) => {
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
      master_id,
      session_type,
      booking_date,
      booking_time,
      time_control,
      number_of_games,
      location_type,
      price_per_game,
      total_price,
      notes
    }: CreateBookingRequest = req.body;

    // Validate required fields
    if (!master_id || !session_type || !booking_date || !booking_time) {
      return res.status(400).json({
        success: false,
        message: 'Master, session type, date, and time are required'
      });
    }

    // Verify master exists and is available
    const masterCheck = await pool.query(
      'SELECT * FROM masters WHERE id = $1 AND available = true',
      [master_id]
    );

    if (masterCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Master not available'
      });
    }

    const master = masterCheck.rows[0];

    // Validate pricing (server-side validation)
    const expectedPrice = master[`price_${time_control}`] || master.price_rapid;
    if (Math.abs(price_per_game - expectedPrice) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing'
      });
    }

    const expectedTotal = expectedPrice * number_of_games;
    if (Math.abs(total_price - expectedTotal) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Invalid total price'
      });
    }

    // Create booking (auto-confirmed in Phase 1)
    const result = await pool.query(
      `INSERT INTO bookings (
        user_id, master_id, session_type, booking_date, booking_time,
        time_control, number_of_games, location_type,
        price_per_game, total_price, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed')
      RETURNING *`,
      [
        userId, master_id, session_type, booking_date, booking_time,
        time_control, number_of_games, location_type,
        price_per_game, total_price, notes
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Booking confirmed',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking'
    });
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT
        b.*,
        m.name as master_name,
        m.title as master_title
      FROM bookings b
      LEFT JOIN masters m ON b.master_id = m.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch bookings'
    });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        b.*,
        m.name as master_name,
        m.title as master_title
      FROM bookings b
      LEFT JOIN masters m ON b.master_id = m.id
      WHERE b.id = $1 AND b.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch booking'
    });
  }
};
