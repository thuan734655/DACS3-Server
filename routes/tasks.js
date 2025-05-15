import express from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment
} from "../controllers/taskController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET all tasks with pagination
router.get("/", getAllTasks);

// GET task by ID
router.get("/:id", getTaskById);

// POST create new task
router.post("/", createTask);

// PUT update task
router.put("/:id", updateTask);

// DELETE task
router.delete("/:id", deleteTask);

// POST add comment to task
router.post("/:id/comments", addComment);

export default router; 