import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const kanbanSchema = new mongoose.Schema({
  workspace_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  columns: [
    {
      name: {
        type: String,
      },
      task_ids: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
      ],
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Kanban = mongoose.model("Kanban", kanbanSchema);

export default Kanban;
