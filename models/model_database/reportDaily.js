import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const reportDailySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  completed_tasks: [{
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    notes: String,
    spent_hours: {
      type: Number,
      default: 0
    }
  }],
  in_progress_tasks: [{
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    notes: String,
    spent_hours: {
      type: Number,
      default: 0
    },
    progress_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  planned_tasks: [{
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    notes: String,
    estimated_hours: {
      type: Number,
      default: 0
    }
  }],
  issues: [{
    description: {
      type: String,
      required: true
    },
    is_blocking: {
      type: Boolean,
      default: false
    }
  }],
  general_notes: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure one daily report per user per workspace per date
reportDailySchema.index({ user_id: 1, workspace_id: 1, date: 1 }, { unique: true });

const ReportDaily = mongoose.model("ReportDaily", reportDailySchema);

export default ReportDaily; 