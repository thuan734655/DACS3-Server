import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";
import { type } from "os";

connectDB();

const invitationSchema = new mongoose.Schema({
  type_invitation: {
    type: String,
    enum: ["channel", "workspace"],
    required: true,
  },
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: false,
  },
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: false,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: false,
  },
  email: {
    type: String,
    required: true,
  },
  invited_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
