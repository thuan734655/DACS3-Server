import Epic from "../models/model_database/epics.js";
import Workspace from "../models/model_database/workspaces.js";
import Notification from "../models/model_database/notifications.js";
import { checkWorkspacePermission } from "../helper/checkRole.js";


// Get all epics with pagination and filtering
export const getAllEpics = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Filter by workspace_id if provided
    if (req.query.workspace_id) {
      query.workspace_id = req.query.workspace_id;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by assigned_to if provided
    if (req.query.assigned_to) {
      query.assigned_to = req.query.assigned_to;
    }
    
    // Filter by sprint_id if provided
    if (req.query.sprint_id) {
      query.sprint_id = req.query.sprint_id;
    }

    const epics = await Epic.find(query)
      .populate("workspace_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id")
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    const total = await Epic.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: epics.length,
      total,
      data: epics,
    });
  } catch (error) {
    console.error("Error fetching epics:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get epic by ID
export const getEpicById = async (req, res) => {
  try {
    const epic = await Epic.findById(req.params.id)
      .populate("workspace_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id")
      .populate({
        path: "tasks",
        populate: {
          path: "assigned_to",
          model: "User"
        }
      });

    if (!epic) {
      return res.status(404).json({
        success: false,
        message: "Epic not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: epic,
    });
  } catch (error) {
    console.error("Error fetching epic:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Create a new epic
export const createEpic = async (req, res) => {
  try {
    const {
      title,
      description,
      workspace_id,
      assigned_to,
      status,
      priority,
      start_date,
      due_date,
      sprint_id
    } = req.body;

    const userId = req.user.id;

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create epics in this workspace",
      });
    }

    const newEpic = new Epic({
      title,
      description,
      workspace_id,
      created_by: userId,
      assigned_to: assigned_to || null,
      status: status || "Todo",
      priority: priority || "Medium",
      start_date: start_date || null,
      due_date: due_date || null,
      sprint_id: sprint_id || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    const savedEpic = await newEpic.save();
    
    // Populate the created epic
    const populatedEpic = await Epic.findById(savedEpic._id)
      .populate("workspace_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id");

    // Create notification for the assigned user if different from creator
    if (assigned_to && assigned_to !== userId) {
      const assignNotification = new Notification({
        user_id: assigned_to,
        type: "epic_assigned",
        type_id: savedEpic._id,
        workspace_id: workspace_id,
        content: `You have been assigned to epic "${title}"`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await assignNotification.save();
      
      // Emit socket event for notification
      const io = req.app.get('io');
      io.to(`user-${assigned_to}`).emit('notification:new', await assignNotification.populate("user_id workspace_id"));
    }

    // Get workspace members with Leader or Manager role
    const workspace = await Workspace.findById(workspace_id);
    const managementMembers = workspace.members.filter(
      member => ['Leader', 'Manager'].includes(member.role) && member.user_id.toString() !== userId
    );
    
    // Notify management members
    const io = req.app.get('io');
    
    for (const member of managementMembers) {
      const notification = new Notification({
        user_id: member.user_id,
        type: "epic_created",
        type_id: savedEpic._id,
        workspace_id: workspace_id,
        content: `New epic "${title}" has been created in ${workspace.name}`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await notification.save();
      const populatedNotification = await notification.populate("user_id workspace_id");
      io.to(`user-${member.user_id}`).emit('notification:new', populatedNotification);
    }
    
    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspace_id}`).emit('epic:created', populatedEpic);

    return res.status(201).json({
      success: true,
      data: populatedEpic,
    });
  } catch (error) {
    console.error("Error creating epic:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update an epic
export const updateEpic = async (req, res) => {
  try {
    const epicId = req.params.id;
    const userId = req.user.id;
    
    // Find the epic to check workspace permissions
    const epic = await Epic.findById(epicId);
    if (!epic) {
      return res.status(404).json({
        success: false,
        message: "Epic not found",
      });
    }
    
    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(epic.workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update epics in this workspace",
      });
    }
    
    const {
      title,
      description,
      assigned_to,
      status,
      priority,
      start_date,
      due_date,
      completed_date,
      sprint_id
    } = req.body;
    
    // Keep track of whether assignment changed
    const assignmentChanged = assigned_to && epic.assigned_to && 
                             assigned_to.toString() !== epic.assigned_to.toString();
    const previousAssignee = epic.assigned_to;
    
    // Update epic
    const updatedEpic = await Epic.findByIdAndUpdate(
      epicId,
      {
        title: title || epic.title,
        description: description !== undefined ? description : epic.description,
        assigned_to: assigned_to || epic.assigned_to,
        status: status || epic.status,
        priority: priority || epic.priority,
        start_date: start_date || epic.start_date,
        due_date: due_date || epic.due_date,
        completed_date: completed_date || epic.completed_date,
        sprint_id: sprint_id || epic.sprint_id,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate("workspace_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id");
      
    // Handle notifications for assignment changes
    const io = req.app.get('io');
    
    // If assigned user changed, notify the new assignee
    if (assignmentChanged) {
      // Notify new assignee
      const assignNotification = new Notification({
        user_id: assigned_to,
        type: "epic_assigned",
        type_id: epicId,
        workspace_id: epic.workspace_id,
        content: `You have been assigned to epic "${updatedEpic.title}"`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await assignNotification.save();
      io.to(`user-${assigned_to}`).emit('notification:new', await assignNotification.populate("user_id workspace_id"));
      
      // Notify previous assignee
      if (previousAssignee) {
        const unassignNotification = new Notification({
          user_id: previousAssignee,
          type: "epic_unassigned",
          type_id: epicId,
          workspace_id: epic.workspace_id,
          content: `You have been unassigned from epic "${updatedEpic.title}"`,
          related_id: userId,
          is_read: false,
          created_at: new Date()
        });
        
        await unassignNotification.save();
        io.to(`user-${previousAssignee}`).emit('notification:new', await unassignNotification.populate("user_id workspace_id"));
      }
    }
    
    // Emit to workspace room for real-time updates
    io.to(`workspace-${epic.workspace_id}`).emit('epic:updated', updatedEpic);

    return res.status(200).json({
      success: true,
      data: updatedEpic,
    });
  } catch (error) {
    console.error("Error updating epic:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete an epic
export const deleteEpic = async (req, res) => {
  try {
    const epicId = req.params.id;
    const userId = req.user.id;
    
    // Find the epic to check workspace permissions
    const epic = await Epic.findById(epicId);
    if (!epic) {
      return res.status(404).json({
        success: false,
        message: "Epic not found",
      });
    }
    
    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(epic.workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete epics in this workspace",
      });
    }
    
    // Store epic details before deletion for notifications
    const epicTitle = epic.title;
    const workspaceId = epic.workspace_id;
    
    // Delete the epic
    await Epic.findByIdAndDelete(epicId);
    
    // Get workspace members with Leader or Manager role
    const workspace = await Workspace.findById(workspaceId);
    const managementMembers = workspace.members.filter(
      member => ['Leader', 'Manager'].includes(member.role) && member.user_id.toString() !== userId
    );
    
    // Notify management members
    const io = req.app.get('io');
    
    for (const member of managementMembers) {
      const notification = new Notification({
        user_id: member.user_id,
        type: "epic_deleted",
        type_id: null,
        workspace_id: workspaceId,
        content: `Epic "${epicTitle}" has been deleted from ${workspace.name}`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await notification.save();
      const populatedNotification = await notification.populate("user_id workspace_id");
      io.to(`user-${member.user_id}`).emit('notification:new', populatedNotification);
    }
    
    // If epic was assigned to someone, notify them
    if (epic.assigned_to && epic.assigned_to.toString() !== userId) {
      const assigneeNotification = new Notification({
        user_id: epic.assigned_to,
        type: "epic_deleted",
        type_id: null,
        workspace_id: workspaceId,
        content: `Epic "${epicTitle}" that was assigned to you has been deleted`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await assigneeNotification.save();
      io.to(`user-${epic.assigned_to}`).emit('notification:new', await assigneeNotification.populate("user_id workspace_id"));
    }
    
    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspaceId}`).emit('epic:deleted', {
      epicId,
      workspaceId,
      message: `Epic "${epicTitle}" has been deleted`
    });

    return res.status(200).json({
      success: true,
      message: "Epic deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting epic:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}; 