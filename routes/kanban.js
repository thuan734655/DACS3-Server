import express from "express";
import authenticateToken from "../middlewares/authenticateToken.js";
import {
  createKanbanController,
  getKanbansByWorkspaceController,
  getKanbanByIdController,
  updateKanbanController,
  deleteKanbanController,
} from "../controllers/kanbanController.js";

const router = express.Router();

router.post("/kanbans", authenticateToken, createKanbanController);
router.get(
  "/workspaces/:workspace_id/kanbans",
  authenticateToken,
  getKanbansByWorkspaceController
);
router.get("/kanbans/:kanban_id", authenticateToken, getKanbanByIdController);
router.put("/kanbans/:kanban_id", authenticateToken, updateKanbanController);
router.delete("/kanbans/:kanban_id", authenticateToken, deleteKanbanController);

export default router;
