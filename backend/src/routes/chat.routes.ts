import { Router } from 'express';
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
} from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/chat/send
 * Send message to chatbot
 * Protected route - requires authentication
 */
router.post('/send', authMiddleware, sendMessage);

/**
 * GET /api/chat/history/:userId
 * Get chat history for user
 * Protected route - requires authentication
 */
router.get('/history/:userId', authMiddleware, getChatHistory);

/**
 * DELETE /api/chat/history/:userId
 * Clear chat history for user
 * Protected route - requires authentication
 */
router.delete('/history/:userId', authMiddleware, clearChatHistory);

export default router;
