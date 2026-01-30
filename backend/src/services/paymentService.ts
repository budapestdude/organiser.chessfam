import { query } from '../config/database';
import { createCheckoutSession, createRefund, getCheckoutSession } from './stripeService';
import { sendBookingConfirmation, sendTournamentRegistration } from './emailService';
import { markClubPaymentAsCompleted } from './clubPaymentService';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export interface CreateMasterBookingPaymentInput {
  userId: number;
  bookingId: number;
  masterName: string;
  amount: number; // in cents
  duration: number;
  date: string;
  time: string;
  userEmail: string;
  userName: string;
}

export interface CreateTournamentPaymentInput {
  userId: number;
  tournamentId: number;
  tournamentName: string;
  venue: string;
  amount: number; // in cents
  date: string;
  time: string;
  userEmail: string;
  userName: string;
}

export interface PaymentRecord {
  id: number;
  user_id: number;
  booking_id: number | null;
  tournament_id: number | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  created_at: Date;
  completed_at: Date | null;
}

// Create payment record and Stripe checkout for master booking
export const createMasterBookingPayment = async (
  input: CreateMasterBookingPaymentInput
): Promise<{ sessionId: string; url: string; paymentId: number }> => {
  // Create payment record
  const paymentResult = await query(
    `INSERT INTO payments (user_id, booking_id, amount, currency, status, payment_type, description)
     VALUES ($1, $2, $3, 'usd', 'pending', 'master_booking', $4)
     RETURNING id`,
    [input.userId, input.bookingId, input.amount, `Booking with ${input.masterName}`]
  );

  const paymentId = paymentResult.rows[0].id;

  // Create Stripe checkout session
  const session = await createCheckoutSession({
    mode: 'payment',
    lineItems: [
      {
        name: `Chess Session with ${input.masterName}`,
        description: `${input.duration} minute session on ${input.date} at ${input.time}`,
        amount: input.amount,
        quantity: 1,
      },
    ],
    metadata: {
      type: 'master_booking',
      payment_id: paymentId.toString(),
      booking_id: input.bookingId.toString(),
      user_id: input.userId.toString(),
    },
    customerEmail: input.userEmail,
    successUrl: `${FRONTEND_URL}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${FRONTEND_URL}/payment`,
  });

  // Update payment with session ID
  await query(
    `UPDATE payments SET stripe_checkout_session_id = $1 WHERE id = $2`,
    [session.sessionId, paymentId]
  );

  return {
    sessionId: session.sessionId,
    url: session.url,
    paymentId,
  };
};

// Create payment record and Stripe checkout for tournament entry
export const createTournamentPayment = async (
  input: CreateTournamentPaymentInput
): Promise<{ sessionId: string; url: string; paymentId: number }> => {
  // Create payment record
  const paymentResult = await query(
    `INSERT INTO payments (user_id, tournament_id, amount, currency, status, payment_type, description)
     VALUES ($1, $2, $3, 'usd', 'pending', 'tournament_entry', $4)
     RETURNING id`,
    [input.userId, input.tournamentId, input.amount, `Entry for ${input.tournamentName}`]
  );

  const paymentId = paymentResult.rows[0].id;

  // Create Stripe checkout session
  const session = await createCheckoutSession({
    mode: 'payment',
    lineItems: [
      {
        name: `Tournament Entry: ${input.tournamentName}`,
        description: `${input.date} at ${input.time} - ${input.venue}`,
        amount: input.amount,
        quantity: 1,
      },
    ],
    metadata: {
      type: 'tournament_entry',
      payment_id: paymentId.toString(),
      tournament_id: input.tournamentId.toString(),
      user_id: input.userId.toString(),
    },
    customerEmail: input.userEmail,
    successUrl: `${FRONTEND_URL}/tournament-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${FRONTEND_URL}/tournament-payment`,
  });

  // Update payment with session ID
  await query(
    `UPDATE payments SET stripe_checkout_session_id = $1 WHERE id = $2`,
    [session.sessionId, paymentId]
  );

  return {
    sessionId: session.sessionId,
    url: session.url,
    paymentId,
  };
};

// Handle successful payment (called from webhook)
export const handlePaymentSuccess = async (
  sessionId: string,
  paymentIntentId: string
): Promise<void> => {
  // Get payment by session ID
  const paymentResult = await query(
    `SELECT id, user_id, booking_id, tournament_id, stripe_payment_intent_id, stripe_checkout_session_id, amount, currency, status, payment_type, created_at, completed_at FROM payments WHERE stripe_checkout_session_id = $1`,
    [sessionId]
  );

  if (paymentResult.rows.length === 0) {
    console.error(`[Payment] Payment not found for session ${sessionId}`);
    return;
  }

  const payment = paymentResult.rows[0] as PaymentRecord;

  // Update payment status
  await query(
    `UPDATE payments
     SET status = 'succeeded',
         stripe_payment_intent_id = $1,
         completed_at = NOW(),
         updated_at = NOW()
     WHERE id = $2`,
    [paymentIntentId, payment.id]
  );

  // Update related entity
  if (payment.payment_type === 'master_booking' && payment.booking_id) {
    await query(
      `UPDATE bookings SET payment_status = 'paid', payment_id = $1, status = 'confirmed' WHERE id = $2`,
      [payment.id, payment.booking_id]
    );

    // Send confirmation email
    const bookingResult = await query(
      `SELECT b.*, u.email, u.name as user_name, m.name as master_name
       FROM bookings b
       JOIN users u ON b.student_id = u.id
       JOIN users m ON b.master_id = m.id
       WHERE b.id = $1`,
      [payment.booking_id]
    );

    if (bookingResult.rows.length > 0) {
      const booking = bookingResult.rows[0];
      await sendBookingConfirmation(booking.email, {
        userName: booking.user_name,
        masterName: booking.master_name,
        date: new Date(booking.date).toLocaleDateString(),
        time: booking.time,
        duration: booking.duration,
        amount: payment.amount,
        bookingId: payment.booking_id,
      });
    }
  } else if (payment.payment_type === 'tournament_entry' && payment.tournament_id) {
    // Get or create registration
    const regResult = await query(
      `UPDATE tournament_registrations
       SET payment_status = 'paid', payment_id = $1, status = 'confirmed'
       WHERE tournament_id = $2 AND user_id = $3
       RETURNING id`,
      [payment.id, payment.tournament_id, payment.user_id]
    );

    // Send confirmation email
    const tournamentResult = await query(
      `SELECT t.*, u.email, u.name as user_name,
              COALESCE(v.name, t.location) as venue_name
       FROM tournaments t
       JOIN users u ON u.id = $1
       LEFT JOIN venue_submissions v ON v.id = t.venue_id
       WHERE t.id = $2`,
      [payment.user_id, payment.tournament_id]
    );

    if (tournamentResult.rows.length > 0) {
      const tournament = tournamentResult.rows[0];
      await sendTournamentRegistration(tournament.email, {
        userName: tournament.user_name,
        tournamentName: tournament.name,
        date: new Date(tournament.start_date).toLocaleDateString(),
        time: tournament.start_time || 'TBA',
        venue: tournament.venue_name || tournament.location,
        entryFee: payment.amount,
        registrationId: regResult.rows[0]?.id || payment.id,
      });
    }
  } else if (payment.payment_type === 'club_membership') {
    // Get club_id from payment record
    const clubPaymentResult = await query(
      `SELECT club_id FROM payments WHERE id = $1`,
      [payment.id]
    );

    if (clubPaymentResult.rows.length > 0 && clubPaymentResult.rows[0].club_id) {
      await markClubPaymentAsCompleted(
        payment.id,
        clubPaymentResult.rows[0].club_id,
        payment.user_id
      );
      console.log(`[Payment] Club membership payment ${payment.id} processed`);
    }
  }

  console.log(`[Payment] Payment ${payment.id} completed successfully`);
};

// Handle failed payment (called from webhook)
export const handlePaymentFailed = async (
  sessionId: string
): Promise<void> => {
  await query(
    `UPDATE payments
     SET status = 'failed', updated_at = NOW()
     WHERE stripe_checkout_session_id = $1`,
    [sessionId]
  );

  console.log(`[Payment] Payment failed for session ${sessionId}`);
};

// Process refund
export const processRefund = async (
  paymentId: number,
  adminId: number,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; refundId: string }> => {
  // Get payment
  const paymentResult = await query(
    `SELECT id, user_id, booking_id, tournament_id, stripe_payment_intent_id, stripe_checkout_session_id, amount, currency, status, payment_type, created_at, completed_at FROM payments WHERE id = $1`,
    [paymentId]
  );

  if (paymentResult.rows.length === 0) {
    throw new NotFoundError('Payment not found');
  }

  const payment = paymentResult.rows[0] as PaymentRecord;

  if (payment.status !== 'succeeded') {
    throw new ValidationError('Can only refund succeeded payments');
  }

  if (!payment.stripe_payment_intent_id) {
    throw new ValidationError('Payment has no Stripe payment intent');
  }

  // Process refund via Stripe
  const refund = await createRefund(
    payment.stripe_payment_intent_id,
    amount,
    'requested_by_customer'
  );

  // Update payment record
  const newStatus = amount && amount < payment.amount ? 'partially_refunded' : 'refunded';
  await query(
    `UPDATE payments
     SET status = $1,
         refund_id = $2,
         refund_amount = $3,
         refund_reason = $4,
         refunded_by = $5,
         refunded_at = NOW(),
         updated_at = NOW()
     WHERE id = $6`,
    [newStatus, refund.id, refund.amount, reason, adminId, paymentId]
  );

  // Update related entity status if full refund
  if (newStatus === 'refunded') {
    if (payment.booking_id) {
      await query(
        `UPDATE bookings SET payment_status = 'refunded', status = 'cancelled' WHERE id = $1`,
        [payment.booking_id]
      );
    }
    if (payment.tournament_id) {
      await query(
        `UPDATE tournament_registrations SET payment_status = 'refunded', status = 'cancelled' WHERE tournament_id = $1 AND user_id = $2`,
        [payment.tournament_id, payment.user_id]
      );
    }
  }

  console.log(`[Payment] Refund processed for payment ${paymentId} by admin ${adminId}`);

  return { success: true, refundId: refund.id };
};

// Get payment history for a user
export const getPaymentHistory = async (
  userId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ payments: PaymentRecord[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [paymentsResult, countResult] = await Promise.all([
    query(
      `SELECT p.*,
              b.date as booking_date, b.time as booking_time,
              t.name as tournament_name, t.start_date as tournament_date
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN tournaments t ON p.tournament_id = t.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) FROM payments WHERE user_id = $1`,
      [userId]
    ),
  ]);

  return {
    payments: paymentsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

// Get all payments (admin)
export const getAllPayments = async (
  page: number = 1,
  limit: number = 50,
  status?: string
): Promise<{ payments: PaymentRecord[]; total: number }> => {
  const offset = (page - 1) * limit;

  const whereClause = status ? `WHERE p.status = $4` : '';
  const params = status
    ? [limit, offset, status]
    : [limit, offset];

  const [paymentsResult, countResult] = await Promise.all([
    query(
      `SELECT p.*,
              u.name as user_name, u.email as user_email,
              b.date as booking_date,
              t.name as tournament_name
       FROM payments p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN tournaments t ON p.tournament_id = t.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    ),
    query(
      `SELECT COUNT(*) FROM payments ${status ? 'WHERE status = $1' : ''}`,
      status ? [status] : []
    ),
  ]);

  return {
    payments: paymentsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};
