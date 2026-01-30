import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendSystemNotification
} from '../controllers/notificationsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, getNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.post('/:id/read', authenticateToken, markNotificationRead);
router.post('/read-all', authenticateToken, markAllNotificationsRead);
router.delete('/:id', authenticateToken, deleteNotification);
router.get('/preferences', authenticateToken, getNotificationPreferences);
router.put('/preferences', authenticateToken, updateNotificationPreferences);

// Admin-only route
router.post('/system', authenticateToken, sendSystemNotification);

export default router;
