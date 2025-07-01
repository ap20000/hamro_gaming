import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  senderId: String,
  text: String,
  attachmentUrl: String,
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
