import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createConversation,
  getUserConversations,
  getConversationById,
  addMessage,
  deleteConversation
} from '../controllers/chat.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new conversation
router.post('/', createConversation);

// Get all conversations for the user
router.get('/', getUserConversations);

// Get a specific conversation by ID
router.get('/:id', getConversationById);

// Add a message to a conversation
router.post('/:id/messages', addMessage);

// Delete a conversation
router.delete('/:id', deleteConversation);

export default router;