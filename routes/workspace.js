import express from "express";
import {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
  leaveWorkspace,
  getAllWorkspacesByUserId
} from "../controllers/workspaceController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET all workspaces with pagination
router.get("/", getAllWorkspaces);

// GET all workspaces for a user
router.get("/user/:userId?", getAllWorkspacesByUserId);

// GET workspace by ID
router.get("/:id", getWorkspaceById);

// POST create new workspace
router.post("/", createWorkspace);

// PUT update workspace
router.put("/:id", updateWorkspace);

// DELETE workspace
router.delete("/:id", deleteWorkspace);

// PUT add member to workspace (by admin/owner)
router.put("/:id/members", addMember);

// DELETE remove member from workspace (by admin/owner)
router.delete("/:id/members/:userId", removeMember);

// DELETE leave a workspace (self-leave)
router.delete("/:id/leave", leaveWorkspace);

export default router; 