import { Router } from "express";
import {
  createSprintController,
  getAllSprintsController,
  getSprintByIdController,
  updateSprintController,
  deleteSprintController,
  addTaskToSprintController,
  removeTaskFromSprintController,
  updateTaskStatusInSprintController
} from "../controllers/sprintController.js";
import validate from "../middlewares/validate_middelware.js";
import { 
  createSprintSchema, 
  updateSprintSchema,
  addTaskSchema,
  updateTaskStatusSchema
} from "../helper/joi/sprint_schema.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken);

// Tạo sprint mới
router.post(
  "/",
  validate(createSprintSchema),
  createSprintController
);

// Lấy tất cả sprint trong workspace
router.get(
  "/workspace/:workspace_id",
  getAllSprintsController
);

// Lấy sprint theo ID
router.get(
  "/:id",
  getSprintByIdController
);

// Cập nhật sprint
router.put(
  "/:id",
  validate(updateSprintSchema),
  updateSprintController
);

// Xóa sprint
router.delete(
  "/:id",
  deleteSprintController
);

// Thêm task vào sprint
router.post(
  "/:id/tasks",
  validate(addTaskSchema),
  addTaskToSprintController
);

// Xóa task khỏi sprint
router.delete(
  "/:id/tasks/:task_id",
  removeTaskFromSprintController
);

// Cập nhật trạng thái task trong sprint
router.patch(
  "/:id/tasks/:task_id/status",
  validate(updateTaskStatusSchema),
  updateTaskStatusInSprintController
);

export default router; 