import express from "express";
import {
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getAllUserWorkspaces,
} from "../controllers/workspace.js";

const router = express.Router();

router.post("/", createWorkspace);
router.get("/:id", getWorkspace);
router.put("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);
router.get("/", getAllUserWorkspaces);

export default router;
