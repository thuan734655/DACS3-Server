import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const reportSchema = new mongoose.Schema({
  user_id: {
    type: "ObjectId",
    ref: "User",
    required: true,
  },
  workspace_id: {
    type: "ObjectId",
    ref: "Workspace",
    required: true,
  },
  date: {
    type: "Date",
    required: true,
  },
  content: {
    type: "String",
    required: true,
  },
  tasks: {
    type: [
      {
        task_id: {
          type: "ObjectId",
          ref: "Task",
        },
        status: {
          type: "String",
          enum: ["To Do", "In Progress", "Done"],
        },
      },
    ],
    required: false,
  },
  created_at: {
    type: "Date",
    default: "Date.now",
  },
});

const ReportDaily = mongoose.model("ReportDaily", reportSchema);

export default ReportDaily;
