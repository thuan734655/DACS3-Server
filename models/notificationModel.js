import Notification from "./model_database/notifications.js";

const createNotificationModel = async (notificationData) => {
  try {
    const newNotification = new Notification(notificationData);
    await newNotification.save();
    return newNotification;
  } catch (error) {
    throw new Error(`Error creating notification: ${error.message}`);
  }
};

const getAllNotificationsModel = async (filters = {}) => {
  try {
    const notifications = await Notification.find(filters)
      .populate("user_id", "name avatar")
      .sort({ created_at: -1 });
    
    return notifications;
  } catch (error) {
    throw new Error(`Error fetching notifications: ${error.message}`);
  }
};

const getNotificationByIdModel = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId)
      .populate("user_id", "name avatar");
    
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    return notification;
  } catch (error) {
    throw new Error(`Error fetching notification: ${error.message}`);
  }
};

const getNotificationsByWorkspaceModel = async (workspaceId) => {
  try {
    const notifications = await Notification.find({ workspace_id: workspaceId })
      .populate("user_id", "name avatar")
      .sort({ created_at: -1 });
    
    return notifications;
  } catch (error) {
    throw new Error(`Error fetching notifications by workspace: ${error.message}`);
  }
};

const getNotificationsByUserModel = async (userId) => {
  try {
    const notifications = await Notification.find({ user_id: userId })
      .sort({ created_at: -1 });
    
    return notifications;
  } catch (error) {
    throw new Error(`Error fetching notifications by user: ${error.message}`);
  }
};

const markNotificationAsReadModel = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { is_read: true },
      { new: true }
    );
    
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    return notification;
  } catch (error) {
    throw new Error(`Error marking notification as read: ${error.message}`);
  }
};

const deleteNotificationModel = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    return { success: true, message: "Notification deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting notification: ${error.message}`);
  }
};

export {
  createNotificationModel,
  getAllNotificationsModel,
  getNotificationByIdModel,
  getNotificationsByWorkspaceModel,
  getNotificationsByUserModel,
  markNotificationAsReadModel,
  deleteNotificationModel
}; 