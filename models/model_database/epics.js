import mongoose from "mongoose";
import connectDB from "../../config/connectDB.js";

connectDB();

const epicSchema = new mongoose.Schema(
    {
        workspace_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
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
        created_by: {
        type: String,
        required: true,
        },
        created_at: {
        type: Date,
        default: Date.now,
        },
        start_date: {
        type: Date,
        required: false,
        },
        end_date: {
        type: Date,
        required: false,
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
        
    }
);

const Epic = mongoose.model("Epic", epicSchema);

export default Epic;
