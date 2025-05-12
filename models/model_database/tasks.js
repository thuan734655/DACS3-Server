import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const taskSchema = new mongoose.Schema({
  workspace_id: {
    type: "ObjectId",
    ref: "Workspace",
    required: true,
  },
  title: {
    type: "String",
    required: true,
  },
  description: {
    type: "String",
    required: false,
  },
  assigned_to: {
    type: ["ObjectId"],
    ref: "User",
    required: false,
  },
  created_by: {
    type: "ObjectId",
    ref: "User",
    required: true,
  },
  due_date: {
    type: "Date",
    required: false,
  },
  start_date: {
    type: "Date",
    required: false,
  },
  status: {
    type: "String",
    enum: ["To Do", "In Progress", "Done"],
    default: "To Do",
  },
  progress: {
    type: "Number",
    default: 0,
  },
  created_at: {
    type: "Date",
    default: "Date.now",
  },
  updated_at: {
    type: "Date",
    default: "Date.now",
  },
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
