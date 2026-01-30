import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

export interface Booking {
  id: number;
  user_id: number;
  booking_type: string;
  item_id: number;
  item_name: string;
  scheduled_date: Date;
  scheduled_time: string;
  duration_minutes: number;
  price: number;
  status: string;
  notes?: string;
  payment_status: string;
  payment_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookingInput {
  booking_type: 'master' | 'tournament' | 'club' | 'game' | 'venue';
  item_id: number;
  item_name: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  price?: number;
  notes?: string;
}

export const getUserBookings = async (
  userId: number,
  filters: { status?: string; booking_type?: string; page?: number; limit?: number }
): Promise<{ bookings: Booking[]; total: number }> => {
  const { status, booking_type, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE user_id = $1';
  const params: any[] = [userId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  if (booking_type) {
    whereClause += ` AND booking_type = $${paramIndex++}`;
    params.push(booking_type);
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM bookings ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT id, user_id, booking_type, item_id, item_name, scheduled_date, scheduled_time, duration_minutes, price, status, notes, payment_status, payment_id, created_at, updated_at
     FROM bookings ${whereClause}
     ORDER BY scheduled_date DESC, scheduled_time DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return { bookings: result.rows, total };
};

export const getBookingById = async (id: number, userId: number): Promise<Booking> => {
  const result = await query(
    `SELECT id, user_id, booking_type, item_id, item_name, scheduled_date, scheduled_time, duration_minutes, price, status, notes, payment_status, payment_id, created_at, updated_at FROM bookings WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Booking not found');
  }

  const booking = result.rows[0];

  if (booking.user_id !== userId) {
    throw new ForbiddenError('You do not have access to this booking');
  }

  return booking;
};

export const createBooking = async (
  userId: number,
  input: CreateBookingInput
): Promise<Booking> => {
  const {
    booking_type,
    item_id,
    item_name,
    scheduled_date,
    scheduled_time,
    duration_minutes = 60,
    price = 0,
    notes,
  } = input;

  if (!booking_type || !item_id || !item_name || !scheduled_date || !scheduled_time) {
    throw new ValidationError('Missing required booking fields');
  }

  // Check for conflicting bookings
  const conflictResult = await query(
    `SELECT id FROM bookings
     WHERE user_id = $1
     AND scheduled_date = $2
     AND scheduled_time = $3
     AND status NOT IN ('cancelled')`,
    [userId, scheduled_date, scheduled_time]
  );

  if (conflictResult.rows.length > 0) {
    throw new ValidationError('You already have a booking at this time');
  }

  // Calculate price with premium discount if applicable (for master bookings)
  let originalPrice = price;
  let finalPrice = price;
  let discountApplied = 0;
  let discountType: string | null = null;

  if (booking_type === 'master' && price > 0) {
    // Get master details to check if discount eligible
    const masterResult = await query(
      `SELECT premium_discount_eligible FROM masters WHERE id = $1`,
      [item_id]
    );

    if (masterResult.rows.length > 0 && masterResult.rows[0].premium_discount_eligible) {
      // Check if user has premium subscription
      try {
        const { getSubscriptionStatus } = await import('./subscriptionService');
        const subscription = await getSubscriptionStatus(userId);

        // Apply 10% discount for premium members (including those in trial)
        if (subscription.tier === 'premium' || subscription.inTrial) {
          discountApplied = Math.round(price * 0.1 * 100) / 100; // 10% discount, rounded to 2 decimals
          finalPrice = price - discountApplied;
          discountType = 'premium_member';
        }
      } catch (error) {
        // If subscription check fails, continue without discount
        console.error('Failed to check subscription status for discount:', error);
      }
    }
  }

  const result = await query(
    `INSERT INTO bookings (
      user_id, booking_type, item_id, item_name, scheduled_date, scheduled_time,
      duration_minutes, price, original_price, discount_applied, discount_type, notes
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [userId, booking_type, item_id, item_name, scheduled_date, scheduled_time, duration_minutes,
     finalPrice, originalPrice, discountApplied, discountType, notes]
  );

  return result.rows[0];
};

export const updateBookingStatus = async (
  id: number,
  userId: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
): Promise<Booking> => {
  const booking = await getBookingById(id, userId);

  if (booking.status === 'completed' && status !== 'completed') {
    throw new ValidationError('Cannot change status of a completed booking');
  }

  const result = await query(
    `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );

  return result.rows[0];
};

export const cancelBooking = async (id: number, userId: number): Promise<Booking> => {
  const booking = await getBookingById(id, userId);

  if (booking.status === 'completed') {
    throw new ValidationError('Cannot cancel a completed booking');
  }

  if (booking.status === 'cancelled') {
    throw new ValidationError('Booking is already cancelled');
  }

  const result = await query(
    `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

export const getUpcomingBookings = async (userId: number): Promise<Booking[]> => {
  const result = await query(
    `SELECT id, user_id, booking_type, item_id, item_name, scheduled_date, scheduled_time, duration_minutes, price, status, notes, payment_status, payment_id, created_at, updated_at
     FROM bookings
     WHERE user_id = $1
     AND status IN ('pending', 'confirmed')
     AND scheduled_date >= CURRENT_DATE
     ORDER BY scheduled_date ASC, scheduled_time ASC
     LIMIT 10`,
    [userId]
  );

  return result.rows;
};

export const getBookingStats = async (userId: number): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}> => {
  const result = await query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
       COUNT(*) FILTER (WHERE status = 'completed') as completed,
       COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
     FROM bookings WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];
  return {
    total: parseInt(row.total),
    pending: parseInt(row.pending),
    confirmed: parseInt(row.confirmed),
    completed: parseInt(row.completed),
    cancelled: parseInt(row.cancelled),
  };
};
