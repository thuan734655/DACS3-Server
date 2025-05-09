import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const messageSchema = new mongoose.Schema({
  channel_id: {
    type: "ObjectId",
    ref: "Channel",
    required: true,
  },
  sender_id: {
    type: "ObjectId",
    ref: "User",
    required: true,
  },
  content: {
    type: "String",
    required: false,
  },
  type: {
    type: "String",
    enum: ["text", "image", "file"],
    default: "text",
  },
  file_url: {
    type: "String",
    required: false,
  },
  mentions: {
    type: ["ObjectId"],
    ref: "User",
    required: false,
  },
  reactions: {
    type: [
      {
        emoji: { type: "String" },
        user_ids: [{ type: "ObjectId", ref: "User" }],
      },
    ],
    default: [],
  },
  thread_parent_id: {
    type: "ObjectId",
    ref: "Message",
    default: null,
  },
  created_at: {
    type: "Date",
    default: Date.now,
  },
  updated_at: {
    type: "Date",
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
