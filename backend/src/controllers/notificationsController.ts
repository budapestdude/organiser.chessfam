import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Get user's notifications
 * GET /notifications
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { limit = '50', offset = '0', unread_only = 'false' } = req.query;

    let query = `
      SELECT *
      FROM notifications
      WHERE user_id = $1
    `;

    if (unread_only === 'true') {
      query += ' AND read_at IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';

    const result = await pool.query(query, [userId, limit, offset]);

    // Get unread count
    const countResult = await pool.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      unread_count: parseInt(countResult.rows[0].unread_count)
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Get unread notification count
 * GET /notifications/unread-count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );

    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 * POST /notifications/:id/read
 */
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const notificationId = parseInt(req.params.id);

    const result = await pool.query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or already read'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 * POST /notifications/read-all
 */
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL
       RETURNING id`,
      [userId]
    );

    res.json({
      success: true,
      message: `Marked ${result.rowCount} notifications as read`
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete a notification
 * DELETE /notifications/:id
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const notificationId = parseInt(req.params.id);

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

/**
 * Get notification preferences
 * GET /notifications/preferences
 */
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    let result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    // Create default preferences if they don't exist
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO notification_preferences (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message
    });
  }
};

/**
 * Update notification preferences
 * PUT /notifications/preferences
 */
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const {
      tournament_join_enabled,
      club_join_enabled,
      game_invite_enabled,
      system_messages_enabled,
      email_notifications_enabled
    } = req.body;

    // Ensure preferences exist
    await pool.query(
      `INSERT INTO notification_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Update preferences
    const result = await pool.query(
      `UPDATE notification_preferences
       SET tournament_join_enabled = COALESCE($2, tournament_join_enabled),
           club_join_enabled = COALESCE($3, club_join_enabled),
           game_invite_enabled = COALESCE($4, game_invite_enabled),
           system_messages_enabled = COALESCE($5, system_messages_enabled),
           email_notifications_enabled = COALESCE($6, email_notifications_enabled),
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [
        userId,
        tournament_join_enabled,
        club_join_enabled,
        game_invite_enabled,
        system_messages_enabled,
        email_notifications_enabled
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Notification preferences updated'
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

/**
 * Send a custom system notification (admin only)
 * POST /notifications/system
 */
export const sendSystemNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, user_ids } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // If user_ids provided, send to specific users, otherwise send to all
    let userIdsToNotify: number[] = user_ids || [];

    if (!user_ids || user_ids.length === 0) {
      const result = await pool.query(
        "SELECT id FROM users WHERE email != 'system@chessfam.com'"
      );
      userIdsToNotify = result.rows.map(row => row.id);
    }

    // Send notifications using the database function
    for (const userId of userIdsToNotify) {
      await pool.query(
        'SELECT send_notification($1, $2, $3, $4, NULL, NULL)',
        [userId, 'system_message', title, message]
      );
    }

    res.json({
      success: true,
      message: `Notification sent to ${userIdsToNotify.length} users`
    });
  } catch (error: any) {
    console.error('Error sending system notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send system notification',
      error: error.message
    });
  }
};
