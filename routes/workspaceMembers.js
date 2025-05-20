import express from "express";
import { 
  getUsersInSameWorkspaces,
  getMembersByWorkspaceId,
  searchMembersInWorkspace 
} from "../controllers/workspaceMemberController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authentication middleware for all routes
router.use(authenticateToken);

// GET all users who share workspaces with the current user
router.get("/shared", getUsersInSameWorkspaces);

// GET all members in a specific workspace
router.get("/workspace/:workspaceId", getMembersByWorkspaceId);

// SEARCH for members in a specific workspace
router.get("/workspace/:workspaceId/search", searchMembersInWorkspace);

export default router;
