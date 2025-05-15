import express from "express";
import {
  getAllReports,
  getMyReports,
  getReportById,
  createOrUpdateReport,
  deleteReport,
  getReportsByDate
} from "../controllers/reportDailyController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET all reports with pagination (only accessible to managers)
router.get("/", getAllReports);

// GET my reports
router.get("/me", getMyReports);

// GET reports by date
router.get("/by-date", getReportsByDate);

// GET report by ID
router.get("/:id", getReportById);

// POST create or update report
router.post("/", createOrUpdateReport);

// DELETE report
router.delete("/:id", deleteReport);

export default router; 