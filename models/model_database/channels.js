import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const channelSchema = new mongoose.Schema({
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  created_by: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  members: [
    {
      type: String,
      
    },
  ],
  is_private: {
    type: Boolean,
    default: false,
  },
});

const Channel = mongoose.model("Channel", channelSchema);

export default Channel;
