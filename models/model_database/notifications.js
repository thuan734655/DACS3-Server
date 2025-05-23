import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: "ObjectId",
    ref: "User",
    required: true,
  },
  type: {
    type: "String",
    enum: ["task", "report", "channel", "epic", "sprint", "bug", "invitation"],
    required: true,
  },
  type_id: {
    type: "ObjectId",
    required: true,
  },
  workspace_id: {
    type: "ObjectId",
    ref: "Workspace",
    required: true,
  },
  content: {
    type: "String",
    required: true,
  },
  related_id: {
    type: "ObjectId",
    required: false,
  },
  is_read: {
    type: "Boolean",
    default: false,
  },
  created_at: {
    type: "Date",
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
