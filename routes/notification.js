import express from "express";
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  getNotificationsByWorkspace,
  getNotificationsByUser,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import validate from "../middlewares/validate_middelware.js";
import {
  createNotificationSchema,
  validateNotificationId,
  validateWorkspaceId,
  validateUserId,
} from "../validations/notificationSchema.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new notification
router.post("/", validate(createNotificationSchema), createNotification);

// Get all notifications
router.get("/", getAllNotifications);

// Get a notification by ID
router.get(
  "/:id",
  validate(validateNotificationId, "params"),
  getNotificationById
);

// Get notifications by workspace ID
router.get(
  "/workspace/:workspaceId",
  validate(validateWorkspaceId, "params"),
  getNotificationsByWorkspace
);

// Get notifications by user ID
router.get(
  "/user/:userId",
  validate(validateUserId, "params"),
  getNotificationsByUser
);

// Mark a notification as read
router.patch(
  "/:id/read",
  validate(validateNotificationId, "params"),
  markNotificationAsRead
);

// Delete a notification
router.delete(
  "/:id",
  validate(validateNotificationId, "params"),
  deleteNotification
);

export default router;
