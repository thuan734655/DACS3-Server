import express from "express";
import {
  getAllBugs,
  getBugById,
  createBug,
  updateBug,
  deleteBug,
  addComment
} from "../controllers/bugController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET all bugs with pagination
router.get("/", getAllBugs);

// GET bug by ID
router.get("/:id", getBugById);

// POST create new bug
router.post("/", createBug);

// PUT update bug
router.put("/:id", updateBug);

// DELETE bug
router.delete("/:id", deleteBug);

// POST add comment to bug
router.post("/:id/comments", addComment);

export default router; 