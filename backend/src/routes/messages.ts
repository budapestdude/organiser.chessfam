import { Router } from 'express';
import * as messagesController from '../controllers/messagesController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All message routes require authentication
router.use(authenticate);

router.get('/conversations', messagesController.getConversations);
router.get('/conversations/:conversationId', messagesController.getMessages);
router.post('/conversations/:conversationId/read', messagesController.markConversationRead);
router.post('/send', messagesController.sendMessage);
router.post('/start', messagesController.startConversation);
router.get('/unread', messagesController.getUnreadCount);

export default router;
