import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

export interface ClubEvent {
  id: number;
  club_id: number;
  created_by: number;
  creator_name?: string;
  title: string;
  description?: string;
  event_type: 'meetup' | 'tournament' | 'social' | 'training' | 'other';
  start_time: Date;
  end_time: Date;
  location?: string;
  max_participants?: number;
  is_members_only: boolean;
  rsvp_count?: number;
  user_rsvp_status?: string;
  created_at: Date;
  updated_at: Date;
}

// Verify user permissions for event management
const verifyEventPermissions = async (clubId: number, userId: number): Promise<{ role: string }> => {
  const result = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, userId]
  );

  if (result.rows.length === 0) {
    throw new ForbiddenError('You must be a club member to manage events');
  }

  const role = result.rows[0].role;
  if (!['owner', 'admin', 'officer'].includes(role)) {
    throw new ForbiddenError('Only club officers, admins, and owners can create events');
  }

  return result.rows[0];
};

// Create a new event
export const createEvent = async (
  clubId: number,
  userId: number,
  eventData: {
    title: string;
    description?: string;
    event_type: string;
    start_time: Date;
    end_time: Date;
    location?: string;
    max_participants?: number;
    is_members_only?: boolean;
  }
): Promise<ClubEvent> => {
  await verifyEventPermissions(clubId, userId);

  if (!eventData.title || eventData.title.trim().length === 0) {
    throw new ValidationError('Event title is required');
  }

  if (new Date(eventData.start_time) < new Date()) {
    throw new ValidationError('Event start time cannot be in the past');
  }

  if (new Date(eventData.end_time) <= new Date(eventData.start_time)) {
    throw new ValidationError('Event end time must be after start time');
  }

  const result = await query(
    `INSERT INTO club_events (
       club_id, created_by, title, description, event_type, start_time, end_time,
       location, max_participants, is_members_only
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      clubId,
      userId,
      eventData.title,
      eventData.description,
      eventData.event_type,
      eventData.start_time,
      eventData.end_time,
      eventData.location,
      eventData.max_participants,
      eventData.is_members_only !== false,
    ]
  );

  return result.rows[0];
};

// Get club events with optional date range filtering
export const getClubEvents = async (
  clubId: number,
  userId?: number,
  startDate?: Date,
  endDate?: Date
): Promise<ClubEvent[]> => {
  let whereClause = 'WHERE ce.club_id = $1';
  const params: any[] = [clubId];
  let paramIndex = 2;

  if (startDate) {
    whereClause += ` AND ce.start_time >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND ce.start_time <= $${paramIndex++}`;
    params.push(endDate);
  }

  const userRsvpJoin = userId
    ? `LEFT JOIN club_event_rsvps cer ON ce.id = cer.event_id AND cer.user_id = $${paramIndex}`
    : '';

  if (userId) {
    params.push(userId);
  }

  const result = await query(
    `SELECT
       ce.*,
       u.name as creator_name,
       COUNT(DISTINCT rsvp.id) FILTER (WHERE rsvp.status = 'going') as rsvp_count
       ${userId ? ', cer.status as user_rsvp_status' : ''}
     FROM club_events ce
     JOIN users u ON ce.created_by = u.id
     LEFT JOIN club_event_rsvps rsvp ON ce.id = rsvp.event_id
     ${userRsvpJoin}
     ${whereClause}
     GROUP BY ce.id, u.name${userId ? ', cer.status' : ''}
     ORDER BY ce.start_time ASC`,
    params
  );

  return result.rows;
};

// Get single event with details
export const getEventById = async (eventId: number, userId?: number): Promise<ClubEvent> => {
  const params: any[] = [eventId];
  const userRsvpSelect = userId ? ', cer.status as user_rsvp_status' : '';
  const userRsvpJoin = userId ? `LEFT JOIN club_event_rsvps cer ON ce.id = cer.event_id AND cer.user_id = $2` : '';

  if (userId) {
    params.push(userId);
  }

  const result = await query(
    `SELECT
       ce.*,
       u.name as creator_name,
       COUNT(DISTINCT rsvp.id) FILTER (WHERE rsvp.status = 'going') as rsvp_count
       ${userRsvpSelect}
     FROM club_events ce
     JOIN users u ON ce.created_by = u.id
     LEFT JOIN club_event_rsvps rsvp ON ce.id = rsvp.event_id
     ${userRsvpJoin}
     WHERE ce.id = $1
     GROUP BY ce.id, u.name${userId ? ', cer.status' : ''}`,
    params
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Event not found');
  }

  return result.rows[0];
};

// RSVP to an event
export const rsvpToEvent = async (
  eventId: number,
  userId: number,
  status: 'going' | 'maybe' | 'not_going',
  notes?: string
): Promise<void> => {
  // Get event details
  const eventResult = await query(
    `SELECT club_id, max_participants, is_members_only FROM club_events WHERE id = $1`,
    [eventId]
  );

  if (eventResult.rows.length === 0) {
    throw new NotFoundError('Event not found');
  }

  const event = eventResult.rows[0];

  // Check if members-only event
  if (event.is_members_only) {
    const memberResult = await query(
      `SELECT id FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
      [event.club_id, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new ForbiddenError('This event is for club members only');
    }
  }

  // Check max participants if status is 'going'
  if (status === 'going' && event.max_participants) {
    const countResult = await query(
      `SELECT COUNT(*) FROM club_event_rsvps WHERE event_id = $1 AND status = 'going'`,
      [eventId]
    );

    if (parseInt(countResult.rows[0].count) >= event.max_participants) {
      throw new ValidationError('Event is at maximum capacity');
    }
  }

  // Upsert RSVP
  await query(
    `INSERT INTO club_event_rsvps (event_id, user_id, status, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (event_id, user_id)
     DO UPDATE SET status = $3, notes = $4, rsvp_at = NOW()`,
    [eventId, userId, status, notes]
  );
};

// Update an event
export const updateEvent = async (
  eventId: number,
  userId: number,
  updates: Partial<{
    title: string;
    description: string;
    event_type: string;
    start_time: Date;
    end_time: Date;
    location: string;
    max_participants: number;
    is_members_only: boolean;
  }>
): Promise<ClubEvent> => {
  // Get event and verify permissions
  const eventResult = await query(
    `SELECT club_id, created_by FROM club_events WHERE id = $1`,
    [eventId]
  );

  if (eventResult.rows.length === 0) {
    throw new NotFoundError('Event not found');
  }

  const event = eventResult.rows[0];
  await verifyEventPermissions(event.club_id, userId);

  // Validate time updates
  if (updates.start_time && updates.end_time) {
    if (new Date(updates.end_time) <= new Date(updates.start_time)) {
      throw new ValidationError('Event end time must be after start time');
    }
  }

  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const allowedFields = ['title', 'description', 'event_type', 'start_time', 'end_time', 'location', 'max_participants', 'is_members_only'];

  for (const field of allowedFields) {
    if (updates[field as keyof typeof updates] !== undefined) {
      updateFields.push(`${field} = $${paramIndex++}`);
      values.push(updates[field as keyof typeof updates]);
    }
  }

  if (updateFields.length === 0) {
    return getEventById(eventId);
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(eventId);

  const result = await query(
    `UPDATE club_events SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
};

// Delete an event
export const deleteEvent = async (eventId: number, userId: number): Promise<void> => {
  const eventResult = await query(
    `SELECT club_id, created_by FROM club_events WHERE id = $1`,
    [eventId]
  );

  if (eventResult.rows.length === 0) {
    throw new NotFoundError('Event not found');
  }

  const event = eventResult.rows[0];
  const membership = await verifyEventPermissions(event.club_id, userId);

  // Can delete if creator or owner/admin
  const canDelete = event.created_by === userId || ['owner', 'admin'].includes(membership.role);

  if (!canDelete) {
    throw new ForbiddenError('You can only delete events you created');
  }

  await query(`DELETE FROM club_events WHERE id = $1`, [eventId]);
};

// Get event attendees
export const getEventAttendees = async (eventId: number): Promise<any[]> => {
  const result = await query(
    `SELECT
       cer.status,
       cer.rsvp_at,
       cer.notes,
       u.id as user_id,
       u.name as user_name,
       u.avatar as user_avatar
     FROM club_event_rsvps cer
     JOIN users u ON cer.user_id = u.id
     WHERE cer.event_id = $1
     ORDER BY cer.rsvp_at DESC`,
    [eventId]
  );

  return result.rows;
};
