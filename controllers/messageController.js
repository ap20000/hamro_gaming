import Message from "../models/Message.js";

export const getMessagesByConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.id,
    }).sort({ createdAt: 1 }); // Sort by oldest first

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text, attachmentUrl } = req.body;

    const newMessage = await Message.create({
      conversationId,
      senderId,
      text,
      attachmentUrl,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
