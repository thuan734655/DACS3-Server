import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";
connectDB();

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  is_private: {
    type: Boolean,
    default: false,
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      last_read: {
        type: Date,
        default: null,
      },
      joined_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  last_message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  last_message_preview: {
    type: String,
  },
  last_message_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Channel = mongoose.model("Channel", channelSchema);

export default Channel;
