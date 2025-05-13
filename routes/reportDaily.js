import { Router } from "express";
import {
  createReportDailyController,
  getAllReportsDailyController,
  getReportDailyByIdController,
  getMyReportsDailyController,
  getReportsDailyByDateController,
  updateReportDailyController,
  deleteReportDailyController,
} from "../controllers/reportDailyController.js";
import validate from "../middlewares/validate_middelware.js";
import {
  createReportDailySchema,
  updateReportDailySchema,
} from "../helper/joi/reportDaily_schema.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken);

// Tạo daily report mới
router.post(
  "/",
  validate(createReportDailySchema),
  createReportDailyController
);

// Lấy tất cả reports trong workspace
router.get("/workspace/:workspace_id", getAllReportsDailyController);

// Lấy các report của người dùng hiện tại
router.get("/my-reports", getMyReportsDailyController);

// Lấy các report theo ngày trong workspace
router.get(
  "/workspace/:workspace_id/date/:date",
  getReportsDailyByDateController
);

// Lấy report theo ID
router.get("/:id", getReportDailyByIdController);

// Cập nhật report
router.put(
  "/:id",
  validate(updateReportDailySchema),
  updateReportDailyController
);

// Xóa report
router.delete("/:id", deleteReportDailyController);

export default router;
