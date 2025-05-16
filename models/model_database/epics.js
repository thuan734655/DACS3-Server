import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const epicSchema = new mongoose.Schema({
  title: {
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
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["TO_DO", "IN_PROGRESS", "DONE"],
    default: "Todo",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  start_date: {
    type: Date,
  },
  due_date: {
    type: Date,
  },
  completed_date: {
    type: Date,
  },
  sprint_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sprint",
  },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Epic = mongoose.model("Epic", epicSchema);

export default Epic;
