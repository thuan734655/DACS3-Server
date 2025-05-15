import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const messageSchema = new mongoose.Schema({
  type_message: {
    type: String,
    enum: ["channel", "direct"],
    required: true,
  },
  reciver_id: {
    type: "ObjectId",
    ref: "User",
    required: false,
  },
  channel_id: {
    type: "ObjectId",
    ref: "Channel",
    required: false,
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
    enum: ["text", "image"],
    default: "text",
  },
  file_url: {
    type: "String",
    required: false,
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
