import express from "express";
import {
  getAllConversations,
  createConversation,
  getConversationById,
} from "../../controllers/conversationController.js";

const router = express.Router();

// GET /api/conversations - Get all conversations
router.get("/", getAllConversations);

// POST /api/conversations - Create a new conversation
router.post("/", createConversation);

// GET /api/conversations/:id - Get a specific conversation
router.get("/:id", getConversationById);

export default router;
