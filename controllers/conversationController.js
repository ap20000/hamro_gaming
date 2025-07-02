import Conversation from '../models/Conversation.js';

export const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { userId, adminId } = req.body;
    const convo = await Conversation.create({ participants: [userId, adminId] });
    res.json(convo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
