import Notification from "../models/model_database/notifications.js";
import mongoose from "mongoose";

// Get all notifications with pagination and filtering
export const getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user_id: req.user.id };

    // Filter by workspace_id if provided
    if (req.query.workspace_id) {
      query.workspace_id = req.query.workspace_id;
    }

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user_id")
      .populate("workspace_id");

    const total = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get notifications by user ID with pagination
export const getNotificationsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user_id: userId };

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user_id")
      .populate("workspace_id");

    const total = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get notifications by workspace ID with pagination
export const getNotificationsByWorkspaceId = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;

    // Validate that workspaceId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID format",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { workspace_id: workspaceId };

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by user_id if provided
    if (req.query.user_id) {
      query.user_id = req.query.user_id;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user_id")
      .populate("workspace_id");

    const total = await Notification.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching workspace notifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get unread notifications
export const getUnreadNotifications = async (req, res) => {
  try {
    const query = {
      user_id: req.user.id,
      is_read: false,
    };

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .populate("user_id")
      .populate("workspace_id");

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get notification by ID
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate("user_id")
      .populate("workspace_id");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Check if this notification belongs to the requesting user
    if (notification.user_id._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only access your own notifications",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error fetching notification:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { user_id, type, type_id, workspace_id, content, related_id } =
      req.body;

    const newNotification = new Notification({
      user_id,
      type,
      type_id,
      workspace_id,
      content,
      related_id,
      is_read: false,
      created_at: new Date(),
    });

    const savedNotification = await newNotification.save();

    // Populate the created notification
    const populatedNotification = await Notification.findById(
      savedNotification._id
    )
      .populate("user_id")
      .populate("workspace_id");

    // Emit socket event for new notification
    const io = req.app.get("io");
    io.to(`user-${user_id}`).emit("notification:new", populatedNotification);

    return res.status(201).json({
      success: true,
      data: populatedNotification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Check if this notification belongs to the requesting user
    if (notification.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only modify your own notifications",
      });
    }

    notification.is_read = true;
    await notification.save();

    // Populate the updated notification
    const updatedNotification = await Notification.findById(req.params.id)
      .populate("user_id")
      .populate("workspace_id");

    // Emit socket event for notification update
    const io = req.app.get("io");
    io.to(`user-${req.user.id}`).emit(
      "notification:updated",
      updatedNotification
    );

    return res.status(200).json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const { workspaceId } = req.body;

    const query = { user_id: req.user.id, is_read: false };

    // If workspaceId provided, only mark notifications for that workspace
    if (workspaceId) {
      query.workspace_id = workspaceId;
    }

    await Notification.updateMany(query, { is_read: true });

    // Emit socket event for all notifications read
    const io = req.app.get("io");
    io.to(`user-${req.user.id}`).emit("notification:allRead", {
      workspaceId: workspaceId || null,
    });

    return res.status(200).json({
      success: true,
      message: workspaceId
        ? `All notifications for workspace ${workspaceId} marked as read`
        : "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Check if this notification belongs to the requesting user
    if (notification.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own notifications",
      });
    }

    const notificationId = notification._id;

    // Delete notification
    await Notification.findByIdAndDelete(req.params.id);

    // Emit socket event for notification deletion
    const io = req.app.get("io");
    io.to(`user-${req.user.id}`).emit("notification:deleted", {
      notificationId,
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
