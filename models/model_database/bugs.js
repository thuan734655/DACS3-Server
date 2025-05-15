import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const bugSchema = new mongoose.Schema({
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
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  },
  reported_by: {
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
    enum: ["Open", "In Progress", "Fixed", "Rejected", "Closed"],
    default: "Open",
  },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium",
  },
  steps_to_reproduce: {
    type: String,
  },
  expected_behavior: {
    type: String,
  },
  actual_behavior: {
    type: String,
  },
  comments: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    file_name: String,
    file_url: String,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
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

const Bug = mongoose.model("Bug", bugSchema);

export default Bug;
