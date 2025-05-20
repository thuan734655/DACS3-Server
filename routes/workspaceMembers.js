import express from "express";
import { getUsersInSameWorkspaces } from "../controllers/workspaceMemberController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authentication middleware for all routes
router.use(authenticateToken);

// GET all users who share workspaces with the current user
router.get("/shared", getUsersInSameWorkspaces);

export default router;
