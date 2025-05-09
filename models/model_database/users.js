import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  role: [
    {
      workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
      },
      role: {
        type: String,
        enum: ["Leader", "Member"],
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);

export default User;
