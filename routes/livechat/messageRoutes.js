import express from 'express';
import { getMessagesByConversation } from '../../controllers/messageController.js';

const router = express.Router();

router.get('/:id', getMessagesByConversation);

export default router;
