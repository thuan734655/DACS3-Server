import express from "express";
import {
  getAllNotifications,
  getUnreadNotifications,
  getNotificationById,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from "../controllers/notificationController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(authenticateToken);

// GET all notifications with pagination and filtering
router.get("/", getAllNotifications);

// GET unread notifications
router.get("/unread", getUnreadNotifications);

// GET notification by ID
router.get("/:id", getNotificationById);

// POST create new notification
router.post("/", createNotification);

// PUT mark notification as read
router.put("/:id/read", markAsRead);

// PUT mark all notifications as read
router.put("/read-all", markAllAsRead);

// DELETE notification
router.delete("/:id", deleteNotification);

export default router; 