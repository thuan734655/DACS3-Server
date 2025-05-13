import { Router } from "express";
import {
  createWorkspaceController,
  getAllWorkspacesController,
  getWorkspaceByIdController,
  updateWorkspaceController,
  deleteWorkspaceController,
  addMemberController,
  removeMemberController,
} from "../controllers/workspaceController.js";
import validate from "../middlewares/validate_middelware.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
} from "../helper/joi/workspace_schema.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken);

// Tạo workspace mới
router.post("/", validate(createWorkspaceSchema), createWorkspaceController);

// Lấy tất cả workspace của người dùng
router.get("/", getAllWorkspacesController);

// Lấy workspace theo ID
router.get("/:id", getWorkspaceByIdController);

// Cập nhật workspace
router.put("/:id", validate(updateWorkspaceSchema), updateWorkspaceController);

// Xóa workspace
router.delete("/:id", deleteWorkspaceController);

// Thêm thành viên vào workspace
router.post("/:id/members", validate(addMemberSchema), addMemberController);

// Xóa thành viên khỏi workspace
router.delete("/:id/members/:userId", removeMemberController);

export default router;
