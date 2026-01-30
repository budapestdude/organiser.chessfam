import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

export interface ClubMessage {
  id: number;
  club_id: number;
  sender_id: number;
  sender_name?: string;
  sender_avatar?: string;
  message_type: 'general' | 'announcement' | 'event';
  message_text: string;
  is_pinned: boolean;
  is_read?: boolean;
  created_at: Date;
  updated_at: Date;
}

// Verify user is a member of the club
const verifyMembership = async (clubId: number, userId: number): Promise<{ role: string }> => {
  const result = await query(
    `SELECT role FROM club_memberships WHERE club_id = $1 AND user_id = $2 AND status = 'active'`,
    [clubId, userId]
  );

  if (result.rows.length === 0) {
    throw new ForbiddenError('You must be a club member to access messages');
  }

  return result.rows[0];
};

// Send a message to the club
export const sendMessage = async (
  clubId: number,
  userId: number,
  messageText: string,
  messageType: 'general' | 'announcement' | 'event' = 'general'
): Promise<ClubMessage> => {
  const membership = await verifyMembership(clubId, userId);

  // Only owners and admins can send announcements
  if (messageType === 'announcement' && !['owner', 'admin'].includes(membership.role)) {
    throw new ForbiddenError('Only owners and admins can send announcements');
  }

  if (!messageText || messageText.trim().length === 0) {
    throw new ValidationError('Message text cannot be empty');
  }

  if (messageText.length > 5000) {
    throw new ValidationError('Message text too long (max 5000 characters)');
  }

  const result = await query(
    `INSERT INTO club_messages (club_id, sender_id, message_type, message_text)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [clubId, userId, messageType, messageText]
  );

  return result.rows[0];
};

// Get messages for a club with pagination
export const getMessages = async (
  clubId: number,
  userId: number,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: ClubMessage[]; total: number }> => {
  await verifyMembership(clubId, userId);

  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM club_messages WHERE club_id = $1`,
    [clubId]
  );
  const total = parseInt(countResult.rows[0].count);

  // Get messages with sender info and read status
  const result = await query(
    `SELECT
       cm.*,
       u.name as sender_name,
       u.avatar as sender_avatar,
       CASE WHEN cmr.id IS NOT NULL THEN true ELSE false END as is_read
     FROM club_messages cm
     JOIN users u ON cm.sender_id = u.id
     LEFT JOIN club_message_reads cmr ON cm.id = cmr.message_id AND cmr.user_id = $2
     WHERE cm.club_id = $1
     ORDER BY cm.is_pinned DESC, cm.created_at DESC
     LIMIT $3 OFFSET $4`,
    [clubId, userId, limit, offset]
  );

  return {
    messages: result.rows,
    total,
  };
};

// Mark message as read
export const markAsRead = async (messageId: number, userId: number): Promise<void> => {
  // Verify message exists and user is member
  const messageResult = await query(
    `SELECT club_id FROM club_messages WHERE id = $1`,
    [messageId]
  );

  if (messageResult.rows.length === 0) {
    throw new NotFoundError('Message not found');
  }

  await verifyMembership(messageResult.rows[0].club_id, userId);

  // Insert or update read status
  await query(
    `INSERT INTO club_message_reads (message_id, user_id, read_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = NOW()`,
    [messageId, userId]
  );
};

// Pin/unpin a message (owner/admin only)
export const pinMessage = async (
  messageId: number,
  userId: number,
  pinned: boolean
): Promise<void> => {
  // Get message and verify permissions
  const messageResult = await query(
    `SELECT club_id FROM club_messages WHERE id = $1`,
    [messageId]
  );

  if (messageResult.rows.length === 0) {
    throw new NotFoundError('Message not found');
  }

  const membership = await verifyMembership(messageResult.rows[0].club_id, userId);

  if (!['owner', 'admin'].includes(membership.role)) {
    throw new ForbiddenError('Only owners and admins can pin messages');
  }

  await query(
    `UPDATE club_messages SET is_pinned = $1, updated_at = NOW() WHERE id = $2`,
    [pinned, messageId]
  );
};

// Delete a message (sender or owner/admin)
export const deleteMessage = async (messageId: number, userId: number): Promise<void> => {
  const messageResult = await query(
    `SELECT club_id, sender_id FROM club_messages WHERE id = $1`,
    [messageId]
  );

  if (messageResult.rows.length === 0) {
    throw new NotFoundError('Message not found');
  }

  const message = messageResult.rows[0];
  const membership = await verifyMembership(message.club_id, userId);

  // User can delete if they're the sender or an owner/admin
  const canDelete =
    message.sender_id === userId ||
    ['owner', 'admin'].includes(membership.role);

  if (!canDelete) {
    throw new ForbiddenError('You can only delete your own messages');
  }

  await query(`DELETE FROM club_messages WHERE id = $1`, [messageId]);
};

// Get unread message count for a user
export const getUnreadCount = async (clubId: number, userId: number): Promise<number> => {
  await verifyMembership(clubId, userId);

  const result = await query(
    `SELECT COUNT(*) FROM club_messages cm
     LEFT JOIN club_message_reads cmr ON cm.id = cmr.message_id AND cmr.user_id = $2
     WHERE cm.club_id = $1 AND cmr.id IS NULL AND cm.sender_id != $2`,
    [clubId, userId]
  );

  return parseInt(result.rows[0].count);
};
