import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";
import e from "express";

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
  inprogress: [
    {
      issue: {
        type: "String",
        enum: [("task", "bug")],
        required: false,
      },
      progress: {
        type: "Number",
        required: false,
        default: 0,
      },
    },
  ],
  completed: [
    {
      issue: {
        type: "String",
        enum: [("task", "bug")],
        required: false,
      },
    },
  ],

  created_at: {
    type: "Date",
    default: "Date.now",
  },
});

const ReportDaily = mongoose.model("ReportDaily", reportSchema);

export default ReportDaily;
