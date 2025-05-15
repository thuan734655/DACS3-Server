import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const workspaceSchema = new mongoose.Schema({
  name: {
    type: "String",
    required: true,
  },
  description: {
    type: "String",
    required: false,
  },
  created_by: {
    type: "ObjectId",
    ref: "User",
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  members: {
    type: [
      {
        user_id: {
          type: "ObjectId",
          ref: "User",
        },
        role: {
          type: "String",
          enum: ["Leader", "Manager", "Member"],
        },
      },
    ],
    required: false,
  },
  channels: {
    type: ["ObjectId"],
    ref: "Channel",
    required: false,
  },
});

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;
