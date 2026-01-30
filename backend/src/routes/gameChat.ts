import express from 'express';
import { sendMessage, getMessages, deleteMessage, editMessage } from '../controllers/gameChatController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get messages for a game (public - anyone can view)
router.get('/:gameId/messages', getMessages);

// Send a message (requires authentication and participation)
router.post('/:gameId/messages', authenticateToken, sendMessage);

// Edit a message (requires authentication and ownership)
router.put('/messages/:messageId', authenticateToken, editMessage);

// Delete a message (requires authentication and ownership)
router.delete('/messages/:messageId', authenticateToken, deleteMessage);

export default router;
