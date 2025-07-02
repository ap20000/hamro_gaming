import express from "express";
import {
  getMessagesByConversation,
  createMessage,
} from "../../controllers/messageController.js";

const router = express.Router();

// GET /api/messages/:id - Get messages by conversation ID
router.get("/:id", getMessagesByConversation);

// POST /api/messages - Create a new message
router.post("/", createMessage);

export default router;
