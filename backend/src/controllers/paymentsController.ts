import { Request, Response, NextFunction } from 'express';
import {
  createMasterBookingPayment,
  createTournamentPayment,
  getPaymentHistory,
  getAllPayments,
  processRefund,
} from '../services/paymentService';
import { createClubMembershipPayment } from '../services/clubPaymentService';
import { getCheckoutSession } from '../services/stripeService';
import { query } from '../config/database';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';

// Create checkout for master booking
export const createBookingCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ValidationError('User not authenticated');

    const { bookingId } = req.body;
    if (!bookingId) throw new ValidationError('Booking ID is required');

    // Get booking details
    const bookingResult = await query(
      `SELECT b.*, u.name as master_name, u.email as master_email,
              s.email as student_email, s.name as student_name
       FROM bookings b
       JOIN users u ON b.master_id = u.id
       JOIN users s ON b.student_id = s.id
       WHERE b.id = $1 AND b.student_id = $2`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      throw new NotFoundError('Booking not found');
    }

    const booking = bookingResult.rows[0];

    if (booking.payment_status === 'paid') {
      throw new ValidationError('Booking is already paid');
    }

    // Calculate amount (hourly rate * duration / 60)
    const hourlyRate = booking.rate || 5000; // default $50/hour in cents
    const amount = Math.round((hourlyRate * booking.duration) / 60);

    const result = await createMasterBookingPayment({
      userId,
      bookingId,
      masterName: booking.master_name,
      amount,
      duration: booking.duration,
      date: new Date(booking.date).toLocaleDateString(),
      time: booking.time,
      userEmail: booking.student_email,
      userName: booking.student_name,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Create checkout for tournament entry
export const createTournamentCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ValidationError('User not authenticated');

    const { tournamentId } = req.body;
    if (!tournamentId) throw new ValidationError('Tournament ID is required');

    // Get tournament details
    const tournamentResult = await query(
      `SELECT t.*, COALESCE(v.name, t.location) as venue_name
       FROM tournaments t
       LEFT JOIN venue_submissions v ON v.id = t.venue_id
       WHERE t.id = $1`,
      [tournamentId]
    );

    if (tournamentResult.rows.length === 0) {
      throw new NotFoundError('Tournament not found');
    }

    const tournament = tournamentResult.rows[0];

    // Check if already registered
    const existingReg = await query(
      `SELECT id, tournament_id, user_id, status, payment_status, payment_id
       FROM tournament_registrations
       WHERE tournament_id = $1 AND user_id = $2 AND status != 'cancelled'`,
      [tournamentId, userId]
    );

    if (existingReg.rows.length > 0) {
      if (existingReg.rows[0].payment_status === 'paid') {
        throw new ValidationError('Already registered and paid for this tournament');
      }
    }

    // Get user details
    const userResult = await query(
      `SELECT email, name FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];

    // Create or update registration
    if (existingReg.rows.length === 0) {
      await query(
        `INSERT INTO tournament_registrations (tournament_id, user_id, status, payment_status)
         VALUES ($1, $2, 'pending', 'pending')`,
        [tournamentId, userId]
      );
    }

    const amount = tournament.entry_fee || 0;

    if (amount === 0) {
      // Free tournament - just confirm registration
      await query(
        `UPDATE tournament_registrations
         SET status = 'confirmed', payment_status = 'free'
         WHERE tournament_id = $1 AND user_id = $2`,
        [tournamentId, userId]
      );

      return res.json({
        success: true,
        message: 'Registered successfully (no payment required)',
      });
    }

    const result = await createTournamentPayment({
      userId,
      tournamentId,
      tournamentName: tournament.name,
      venue: tournament.venue_name || tournament.location,
      amount,
      date: new Date(tournament.start_date).toLocaleDateString(),
      time: tournament.start_time || 'TBA',
      userEmail: user.email,
      userName: user.name,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Create checkout for club membership
export const createClubMembershipCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ValidationError('User not authenticated');

    const { clubId, membershipType } = req.body;
    if (!clubId || !membershipType) {
      throw new ValidationError('Club ID and membership type are required');
    }

    if (!['monthly', 'yearly', 'lifetime'].includes(membershipType)) {
      throw new ValidationError('Invalid membership type');
    }

    // Get club details
    const clubResult = await query(
      `SELECT id, name, membership_fee FROM clubs WHERE id = $1 AND is_active = true`,
      [clubId]
    );

    if (clubResult.rows.length === 0) {
      throw new NotFoundError('Club not found');
    }

    const club = clubResult.rows[0];

    // Get user details
    const userResult = await query(`SELECT email, name FROM users WHERE id = $1`, [userId]);
    const user = userResult.rows[0];

    const result = await createClubMembershipPayment({
      userId,
      clubId,
      membershipType: membershipType as 'monthly' | 'yearly' | 'lifetime',
      clubName: club.name,
      membershipFee: club.membership_fee || 50,
      userEmail: user.email,
      userName: user.name,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get payment status by session ID
export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const session = await getCheckoutSession(sessionId);

    // Get our payment record
    const paymentResult = await query(
      `SELECT id, user_id, booking_id, tournament_id, stripe_payment_intent_id, stripe_checkout_session_id, amount, currency, status, payment_type, created_at, completed_at
       FROM payments WHERE stripe_checkout_session_id = $1`,
      [sessionId]
    );

    res.json({
      status: session.payment_status,
      payment: paymentResult.rows[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's payment history
export const getUserPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ValidationError('User not authenticated');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getPaymentHistory(userId, page, limit);

    res.json({
      payments: result.payments,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all payments
export const adminGetPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;

    const result = await getAllPayments(page, limit, status);

    res.json({
      payments: result.payments,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Process refund
export const adminRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) throw new ValidationError('User not authenticated');

    const paymentId = parseInt(req.params.id);
    if (!paymentId) throw new ValidationError('Payment ID is required');

    const { amount, reason } = req.body;

    const result = await processRefund(paymentId, adminId, amount, reason);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
