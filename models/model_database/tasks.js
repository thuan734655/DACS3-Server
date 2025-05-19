import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const taskSchema = new mongoose.Schema({
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
  epic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Epic",
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
    enum: ["Todo", "In Progress", "Done"],
    default: "Todo",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium",
  },
  estimated_hours: {
    type: Number,
    default: 0,
  },
  spent_hours: {
    type: Number,
    default: 0,
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
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
