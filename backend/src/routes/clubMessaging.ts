import express from 'express';
import * as messagingController from '../controllers/clubMessagingController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All messaging routes require authentication
router.post('/clubs/:id/messages', authenticateToken, messagingController.sendMessage);
router.get('/clubs/:id/messages', authenticateToken, messagingController.getMessages);
router.get('/clubs/:id/messages/unread-count', authenticateToken, messagingController.getUnreadCount);
router.post('/messages/:messageId/read', authenticateToken, messagingController.markAsRead);
router.patch('/messages/:messageId/pin', authenticateToken, messagingController.pinMessage);
router.delete('/messages/:messageId', authenticateToken, messagingController.deleteMessage);

export default router;
