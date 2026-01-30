import { query } from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';

export interface Conversation {
  id: number;
  participant_1_id: number;
  participant_2_id: number;
  last_message_at: Date;
  created_at: Date;
  other_user_id?: number;
  other_user_name?: string;
  other_user_avatar?: string;
  last_message?: string;
  unread_count?: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  read_at?: Date;
  created_at: Date;
}

const getOrCreateConversation = async (userId1: number, userId2: number): Promise<number> => {
  // Ensure consistent ordering (smaller ID first)
  const [p1, p2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  // Try to find existing conversation
  const existing = await query(
    `SELECT id FROM conversations WHERE participant_1_id = $1 AND participant_2_id = $2`,
    [p1, p2]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Create new conversation
  const result = await query(
    `INSERT INTO conversations (participant_1_id, participant_2_id)
     VALUES ($1, $2)
     RETURNING id`,
    [p1, p2]
  );

  // Initialize read status for both participants
  await query(
    `INSERT INTO conversation_read_status (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
    [result.rows[0].id, p1, p2]
  );

  return result.rows[0].id;
};

export const getConversations = async (userId: number): Promise<Conversation[]> => {
  const result = await query(
    `SELECT
       c.id,
       c.participant_1_id,
       c.participant_2_id,
       c.last_message_at,
       c.created_at,
       CASE
         WHEN c.participant_1_id = $1 THEN c.participant_2_id
         ELSE c.participant_1_id
       END as other_user_id,
       u.name as other_user_name,
       u.avatar as other_user_avatar,
       m.content as last_message,
       (SELECT COUNT(*) FROM messages
        WHERE conversation_id = c.id
        AND sender_id != $1
        AND (read_at IS NULL OR read_at < created_at)) as unread_count
     FROM conversations c
     JOIN users u ON u.id = CASE
       WHEN c.participant_1_id = $1 THEN c.participant_2_id
       ELSE c.participant_1_id
     END
     LEFT JOIN LATERAL (
       SELECT content FROM messages
       WHERE conversation_id = c.id
       ORDER BY created_at DESC LIMIT 1
     ) m ON true
     WHERE c.participant_1_id = $1 OR c.participant_2_id = $1
     ORDER BY c.last_message_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getMessages = async (
  conversationId: number,
  userId: number,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: Message[]; total: number }> => {
  // Verify user is part of this conversation
  const conversationCheck = await query(
    `SELECT id FROM conversations
     WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)`,
    [conversationId, userId]
  );

  if (conversationCheck.rows.length === 0) {
    throw new ForbiddenError('You are not part of this conversation');
  }

  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM messages WHERE conversation_id = $1`,
    [conversationId]
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );

  return { messages: result.rows.reverse(), total };
};

export const sendMessage = async (
  senderId: number,
  recipientId: number,
  content: string
): Promise<Message> => {
  if (!content || content.trim().length === 0) {
    throw new ValidationError('Message content is required');
  }

  if (senderId === recipientId) {
    throw new ValidationError('Cannot send message to yourself');
  }

  // Verify recipient exists
  const recipientCheck = await query(`SELECT id FROM users WHERE id = $1`, [recipientId]);
  if (recipientCheck.rows.length === 0) {
    throw new NotFoundError('Recipient not found');
  }

  const conversationId = await getOrCreateConversation(senderId, recipientId);

  // Insert message
  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversationId, senderId, content.trim()]
  );

  // Update conversation last_message_at
  await query(
    `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
    [conversationId]
  );

  return result.rows[0];
};

export const markConversationRead = async (
  conversationId: number,
  userId: number
): Promise<void> => {
  // Verify user is part of this conversation
  const conversationCheck = await query(
    `SELECT id FROM conversations
     WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)`,
    [conversationId, userId]
  );

  if (conversationCheck.rows.length === 0) {
    throw new ForbiddenError('You are not part of this conversation');
  }

  // Mark all messages as read
  await query(
    `UPDATE messages SET read_at = NOW()
     WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
    [conversationId, userId]
  );

  // Update read status
  await query(
    `UPDATE conversation_read_status SET last_read_at = NOW()
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.participant_1_id = $1 OR c.participant_2_id = $1)
     AND m.sender_id != $1
     AND m.read_at IS NULL`,
    [userId]
  );

  return parseInt(result.rows[0].count);
};

export const startConversation = async (
  userId: number,
  recipientId: number,
  initialMessage?: string
): Promise<{ conversationId: number; message?: Message }> => {
  if (userId === recipientId) {
    throw new ValidationError('Cannot start conversation with yourself');
  }

  // Verify recipient exists
  const recipientCheck = await query(`SELECT id FROM users WHERE id = $1`, [recipientId]);
  if (recipientCheck.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const conversationId = await getOrCreateConversation(userId, recipientId);

  let message: Message | undefined;
  if (initialMessage && initialMessage.trim().length > 0) {
    message = await sendMessage(userId, recipientId, initialMessage);
  }

  return { conversationId, message };
};
