import express from "express";
import {
  getWeeklyCompletedTasksByUser,
  getWorkspaceWeeklyTaskSummary
} from "../controllers/taskStatsController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET weekly completed tasks for a user
router.get("/weekly/user/:userId?", getWeeklyCompletedTasksByUser);

// GET weekly task summary for a workspace
router.get("/weekly/workspace/:workspaceId", getWorkspaceWeeklyTaskSummary);

export default router;
