import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ updatedAt: -1 });

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          conversationId: conv._id,
        }).sort({ createdAt: -1 });

        return {
          ...conv.toObject(),
          lastMessage: lastMessage?.text || conv.lastMessage || "",
          lastMessageTime:
            lastMessage?.createdAt || conv.lastMessageTime || conv.updatedAt,
          unreadCount: conv.unreadCount || 0,
        };
      })
    );

    res.json(conversationsWithLastMessage);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { conversationId, userId, adminId } = req.body;

    // Check if conversation already exists
    let conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      conversation = await Conversation.create({
        _id: conversationId,
        participants: [userId || "user", adminId || "admin"],
        status: "active",
        lastMessage: "",
        lastMessageTime: new Date(),
        unreadCount: 0,
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
