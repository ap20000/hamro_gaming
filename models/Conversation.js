import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  participants: [String],
}, { timestamps: true });

export default mongoose.model('Conversation', ConversationSchema);
