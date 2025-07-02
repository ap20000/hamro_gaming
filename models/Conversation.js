import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // Change from ObjectId to String to allow custom IDs
      required: true,
    },
    participants: [
      {
        type: String,
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "resolved", "pending"],
      default: "active",
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    _id: false, // Disable automatic _id generation since we're providing custom ones
  }
);

export default mongoose.model("Conversation", conversationSchema);
