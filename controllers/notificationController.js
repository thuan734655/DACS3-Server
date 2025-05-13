import { 
  createNotificationModel, 
  getAllNotificationsModel, 
  getNotificationByIdModel, 
  getNotificationsByWorkspaceModel, 
  getNotificationsByUserModel, 
  markNotificationAsReadModel, 
  deleteNotificationModel 
} from '../models/notificationModel.js';

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const notification = await createNotificationModel(req.body);
    
    // Emit socket event if notification was created successfully
    const io = req.app.get('io');
    if (io) {
      io.to(`workspace_${notification.workspace_id}`).emit('notification:new', notification);
    }
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all notifications
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await getAllNotificationsModel();
    res.status(200).json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a notification by ID
const getNotificationById = async (req, res) => {
  try {
    const notification = await getNotificationByIdModel(req.params.id);
    res.status(200).json(notification);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Get notifications by workspace ID
const getNotificationsByWorkspace = async (req, res) => {
  try {
    const notifications = await getNotificationsByWorkspaceModel(req.params.workspaceId);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get notifications by user ID
const getNotificationsByUser = async (req, res) => {
  try {
    const notifications = await getNotificationsByUserModel(req.params.userId);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Mark a notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await markNotificationAsReadModel(req.params.id);
    res.status(200).json(notification);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const result = await deleteNotificationModel(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export { 
  createNotification, 
  getAllNotifications, 
  getNotificationById, 
  getNotificationsByWorkspace, 
  getNotificationsByUser, 
  markNotificationAsRead, 
  deleteNotification 
}; 