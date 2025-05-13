import { Router } from "express";
import {
  createTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController
} from "../controllers/taskController.js";
import validate from "../middlewares/validate_middelware.js";
import { createTaskSchema, updateTaskSchema } from "../helper/joi/task_schema.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken);

// Tạo task mới
router.post(
  "/",
  validate(createTaskSchema),
  createTaskController
);

// Lấy tất cả task trong workspace
router.get(
  "/workspace/:workspace_id",
  getAllTasksController
);

// Lấy task theo ID
router.get(
  "/:id",
  getTaskByIdController
);

// Cập nhật task
router.put(
  "/:id",
  validate(updateTaskSchema),
  updateTaskController
);

// Xóa task
router.delete(
  "/:id",
  deleteTaskController
);

export default router; 