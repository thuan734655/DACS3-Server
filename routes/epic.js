import { Router } from "express";
import {
  createEpicController,
  getAllEpicsController,
  getEpicByIdController,
  updateEpicController,
  deleteEpicController,
} from "../controllers/epicController.js";
import validate from "../middlewares/validate_middelware.js";
import {
  createEpicSchema,
  updateEpicSchema,
} from "../helper/joi/epic_schema.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken);

// Tạo epic mới
router.post("/", validate(createEpicSchema), createEpicController);

// Lấy tất cả epic trong workspace
router.get("/workspace/:workspace_id", getAllEpicsController);

// Lấy epic theo ID
router.get("/:id", getEpicByIdController);

// Cập nhật epic
router.put("/:id", validate(updateEpicSchema), updateEpicController);

// Xóa epic
router.delete("/:id", deleteEpicController);

export default router;
