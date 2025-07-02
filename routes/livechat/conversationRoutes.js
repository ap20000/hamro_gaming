import express from 'express';
import { getAllConversations, createConversation } from '../../controllers/conversationController.js';

const router = express.Router();

router.get('/', getAllConversations);
router.post('/', createConversation);

export default router;
