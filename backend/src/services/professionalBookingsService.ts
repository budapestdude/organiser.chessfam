import pool from '../config/database';

export interface CreateBookingInput {
  professional_id: number;
  service_id?: number;
  service_name: string;
  pricing_model: 'hourly' | 'per_event' | 'per_day' | 'custom_quote';
  booking_date?: string;
  booking_time?: string;
  duration_hours?: number;
  location_type?: 'online' | 'onsite';
  quantity?: number;
  unit_price?: number;
  total_price: number;
  notes?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  professional_id: number;
  service_id?: number;
  service_name: string;
  pricing_model: string;
  booking_date?: string;
  booking_time?: string;
  duration_hours?: number;
  location_type?: string;
  quantity: number;
  unit_price?: number;
  total_price: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  professional_name?: string;
  professional_email?: string;
  professional_profile_image?: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

/**
 * Create a new booking
 */
export async function createBooking(userId: number, data: CreateBookingInput): Promise<Booking> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify professional exists and is available
    const professionalResult = await client.query(
      `SELECT id, available FROM professionals WHERE id = $1`,
      [data.professional_id]
    );

    if (professionalResult.rows.length === 0) {
      throw new Error('Professional not found');
    }

    if (!professionalResult.rows[0].available) {
      throw new Error('Professional is not currently available');
    }

    // If service_id is provided, verify it exists
    if (data.service_id) {
      const serviceResult = await client.query(
        `SELECT id, available FROM professional_services
         WHERE id = $1 AND professional_id = $2`,
        [data.service_id, data.professional_id]
      );

      if (serviceResult.rows.length === 0) {
        throw new Error('Service not found');
      }

      if (!serviceResult.rows[0].available) {
        throw new Error('Service is not currently available');
      }
    }

    // Determine initial status based on pricing model
    const initialStatus = data.pricing_model === 'custom_quote' ? 'quote_requested' : 'pending';

    // Create booking
    const result = await client.query(
      `INSERT INTO professional_bookings (
        user_id, professional_id, service_id, service_name, pricing_model,
        booking_date, booking_time, duration_hours, location_type,
        quantity, unit_price, total_price, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        data.professional_id,
        data.service_id || null,
        data.service_name,
        data.pricing_model,
        data.booking_date || null,
        data.booking_time || null,
        data.duration_hours || null,
        data.location_type || null,
        data.quantity || 1,
        data.unit_price || null,
        data.total_price,
        initialStatus,
        data.notes || null
      ]
    );

    // Increment professional's total_bookings count
    await client.query(
      `UPDATE professionals SET total_bookings = total_bookings + 1 WHERE id = $1`,
      [data.professional_id]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user's bookings
 */
export async function getUserBookings(
  userId: number,
  filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ bookings: BookingWithDetails[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = ['b.user_id = $1'];
  const params: any[] = [userId];
  let paramCount = 1;

  if (filters.status) {
    paramCount++;
    conditions.push(`b.status = $${paramCount}`);
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      b.*,
      p.name as professional_name,
      u.email as professional_email,
      p.profile_image as professional_profile_image
    FROM professional_bookings b
    JOIN professionals p ON b.professional_id = p.id
    JOIN users u ON p.user_id = u.id
    ${whereClause}
    ORDER BY b.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const countQuery = `
    SELECT COUNT(*)
    FROM professional_bookings b
    ${whereClause}
  `;

  const [result, countResult] = await Promise.all([
    pool.query(query, [...params, limit, offset]),
    pool.query(countQuery, params)
  ]);

  return {
    bookings: result.rows,
    total: parseInt(countResult.rows[0].count)
  };
}

/**
 * Get professional's bookings
 */
export async function getProfessionalBookings(
  professionalId: number,
  filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ bookings: BookingWithDetails[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = ['b.professional_id = $1'];
  const params: any[] = [professionalId];
  let paramCount = 1;

  if (filters.status) {
    paramCount++;
    conditions.push(`b.status = $${paramCount}`);
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      b.*,
      u.name as user_name,
      u.email as user_email,
      u.avatar as user_avatar
    FROM professional_bookings b
    JOIN users u ON b.user_id = u.id
    ${whereClause}
    ORDER BY b.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `;

  const countQuery = `
    SELECT COUNT(*)
    FROM professional_bookings b
    ${whereClause}
  `;

  const [result, countResult] = await Promise.all([
    pool.query(query, [...params, limit, offset]),
    pool.query(countQuery, params)
  ]);

  return {
    bookings: result.rows,
    total: parseInt(countResult.rows[0].count)
  };
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: number): Promise<BookingWithDetails | null> {
  const result = await pool.query(
    `SELECT
      b.*,
      p.name as professional_name,
      pu.email as professional_email,
      p.profile_image as professional_profile_image,
      u.name as user_name,
      u.email as user_email,
      u.avatar as user_avatar
    FROM professional_bookings b
    JOIN professionals p ON b.professional_id = p.id
    JOIN users pu ON p.user_id = pu.id
    JOIN users u ON b.user_id = u.id
    WHERE b.id = $1`,
    [bookingId]
  );

  return result.rows[0] || null;
}

/**
 * Update booking status
 * Only the professional or admin can update status
 */
export async function updateBookingStatus(
  bookingId: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  userId: number,
  isAdmin: boolean = false
): Promise<Booking> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get booking details
    const bookingResult = await client.query(
      `SELECT b.*, p.user_id as professional_user_id
       FROM professional_bookings b
       JOIN professionals p ON b.professional_id = p.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const booking = bookingResult.rows[0];

    // Check permission: must be the professional, the client, or admin
    if (!isAdmin && booking.professional_user_id !== userId && booking.user_id !== userId) {
      throw new Error('Not authorized to update this booking');
    }

    // Update booking status
    const result = await client.query(
      `UPDATE professional_bookings
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, bookingId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Complete a booking (marks as completed)
 */
export async function completeBooking(bookingId: number, userId: number): Promise<Booking> {
  return updateBookingStatus(bookingId, 'completed', userId);
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: number, userId: number): Promise<Booking> {
  return updateBookingStatus(bookingId, 'cancelled', userId);
}

/**
 * Check if user can review a booking
 * (booking must be completed and no review exists yet)
 */
export async function canUserReviewBooking(userId: number, bookingId: number): Promise<boolean> {
  const result = await pool.query(
    `SELECT b.id, b.status, b.user_id, r.id as review_id
     FROM professional_bookings b
     LEFT JOIN professional_reviews r ON r.booking_id = b.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [bookingId, userId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const booking = result.rows[0];
  return booking.status === 'completed' && !booking.review_id;
}

/**
 * Get booking statistics for a professional
 */
export async function getProfessionalBookingStats(professionalId: number): Promise<{
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
}> {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
      COALESCE(SUM(total_price) FILTER (WHERE status IN ('confirmed', 'completed')), 0) as total_revenue
    FROM professional_bookings
    WHERE professional_id = $1`,
    [professionalId]
  );

  return result.rows[0];
}
