import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const sprintSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ["Planned", "Active", "Completed"],
    default: "Planned",
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  goal: {
    type: String,
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task"
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

const Sprint = mongoose.model("Sprint", sprintSchema);

export default Sprint;
