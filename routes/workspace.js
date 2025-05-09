import express from "express";
import {
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getAllUserWorkspaces,
} from "../controllers/workspace.js";
import authenticateToken from "../middlewares/authenticateToken.js";
const router = express.Router();

router.post("/", authenticateToken, createWorkspace);
router.get("/:id", authenticateToken, getWorkspace);
router.put("/:id", authenticateToken, updateWorkspace);
router.delete("/:id", authenticateToken, deleteWorkspace);
router.get("/", authenticateToken, getAllUserWorkspaces);

export default router;
