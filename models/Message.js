import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String, // Change to String to match Conversation _id
      required: true,
      ref: "Conversation",
    },
    senderId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);
