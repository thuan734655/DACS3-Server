import express from "express";
import {
  getAllEpics,
  getEpicById,
  createEpic,
  updateEpic,
  deleteEpic
} from "../controllers/epicController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET all epics with pagination
router.get("/", getAllEpics);

// GET epic by ID
router.get("/:id", getEpicById);

// POST create new epic
router.post("/", createEpic);

// PUT update epic
router.put("/:id", updateEpic);

// DELETE epic
router.delete("/:id", deleteEpic);

export default router; 