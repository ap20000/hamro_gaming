import Message from '../models/Message.js';

export const getMessagesByConversation = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
