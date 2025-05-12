import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const sprintSchema = new mongoose.Schema({
  workspace_is: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  create_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  goal: {
    type: String,
    required: false,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  task: {
    type: [
      {
        task_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
        status: {
          type: String,
          enum: ["To Do", "In Progress", "Done"],
        },
      },
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Done"],
    default: "To Do",
  },
  progress: {
    type: Number,
    default: 0,
  },
});

const Sprint = mongoose.model("Sprint", sprintSchema);

export default Sprint;
