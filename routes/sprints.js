import express from "express";
import {
  getAllSprints,
  getSprintById,
  createSprint,
  updateSprint,
  deleteSprint,
  addItems,
  removeItems,
  getSprintByIdUser
} from "../controllers/sprintController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET all sprints with pagination
router.get("/", getAllSprints);

// GET sprints for the current user
router.get("/user/me", getSprintByIdUser);

// GET sprint by ID
router.get("/:id", getSprintById);

// POST create new sprint
router.post("/", createSprint);

// PUT update sprint
router.put("/:id", updateSprint);

// DELETE sprint
router.delete("/:id", deleteSprint);

// PUT add items (tasks) to sprint
router.put("/:id/items", addItems);

// DELETE remove items from sprint
router.delete("/:id/items", removeItems);

export default router; 