import Bug from "../models/model_database/bugs.js";
import Workspace from "../models/model_database/workspaces.js";
import Task from "../models/model_database/tasks.js";
import Notification from "../models/model_database/notifications.js";
import { checkWorkspacePermission } from "../helper/checkRole.js";

// Get all bugs with pagination and filtering
export const getAllBugs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Filter by workspace_id if provided
    if (req.query.workspace_id) {
      query.workspace_id = req.query.workspace_id;
    }
    
    // Filter by task_id if provided
    if (req.query.task_id) {
      query.task_id = req.query.task_id;
    }
    
    // Filter by reported_by if provided
    if (req.query.reported_by) {
      query.reported_by = req.query.reported_by;
    }
    
    // Filter by assigned_to if provided
    if (req.query.assigned_to) {
      query.assigned_to = req.query.assigned_to;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by severity if provided
    if (req.query.severity) {
      query.severity = req.query.severity;
    }

    const bugs = await Bug.find(query)
      .populate("workspace_id")
      .populate("task_id")
      .populate("reported_by")
      .populate("assigned_to")
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    const total = await Bug.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: bugs.length,
      total,
      data: bugs,
    });
  } catch (error) {
    console.error("Error fetching bugs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get bug by ID
export const getBugById = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate("workspace_id")
      .populate("task_id")
      .populate("reported_by")
      .populate("assigned_to")
      .populate("comments.user_id")
      .populate("attachments.uploaded_by");

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: bug,
    });
  } catch (error) {
    console.error("Error fetching bug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Create a new bug
export const createBug = async (req, res) => {
  try {
    const {
      title,
      description,
      workspace_id,
      task_id,
      assigned_to,
      status,
      severity,
      steps_to_reproduce,
      expected_behavior,
      actual_behavior
    } = req.body;

    const userId = req.user.id;

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to report bugs in this workspace",
      });
    }
    
    // If task_id provided, verify it exists and belongs to the workspace
    if (task_id) {
      const task = await Task.findById(task_id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }
      if (task.workspace_id.toString() !== workspace_id) {
        return res.status(400).json({
          success: false,
          message: "Task does not belong to the specified workspace",
        });
      }
    }

    const newBug = new Bug({
      title,
      description,
      workspace_id,
      task_id: task_id || null,
      reported_by: userId,
      assigned_to: assigned_to || null,
      status: status || "Open",
      severity: severity || "Medium",
      steps_to_reproduce,
      expected_behavior,
      actual_behavior,
      created_at: new Date(),
      updated_at: new Date()
    });

    const savedBug = await newBug.save();
    
    // Populate the created bug
    const populatedBug = await Bug.findById(savedBug._id)
      .populate("workspace_id")
      .populate("task_id")
      .populate("reported_by")
      .populate("assigned_to");

    // Create notification for the assigned user if assigned
    if (assigned_to && assigned_to !== userId) {
      const assignNotification = new Notification({
        user_id: assigned_to,
        type: "bug_assigned",
        type_id: savedBug._id,
        workspace_id: workspace_id,
        content: `You have been assigned to fix bug "${title}"`,
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
        type: "bug_reported",
        type_id: savedBug._id,
        workspace_id: workspace_id,
        content: `New bug "${title}" has been reported in ${workspace.name}`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await notification.save();
      const populatedNotification = await notification.populate("user_id workspace_id");
      io.to(`user-${member.user_id}`).emit('notification:new', populatedNotification);
    }
    
    // If bug is related to a task, notify task owner
    if (task_id) {
      const task = await Task.findById(task_id);
      if (task && task.created_by.toString() !== userId && 
          (!assigned_to || task.created_by.toString() !== assigned_to.toString()) &&
          !managementMembers.some(member => member.user_id.toString() === task.created_by.toString())) {
        
        const taskOwnerNotification = new Notification({
          user_id: task.created_by,
          type: "bug_reported_for_task",
          type_id: savedBug._id,
          workspace_id: workspace_id,
          content: `Bug "${title}" has been reported for your task "${task.title}"`,
          related_id: userId,
          is_read: false,
          created_at: new Date()
        });
        
        await taskOwnerNotification.save();
        io.to(`user-${task.created_by}`).emit('notification:new', await taskOwnerNotification.populate("user_id workspace_id"));
      }
    }
    
    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspace_id}`).emit('bug:created', populatedBug);

    return res.status(201).json({
      success: true,
      data: populatedBug,
    });
  } catch (error) {
    console.error("Error creating bug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update a bug
export const updateBug = async (req, res) => {
  try {
    const bugId = req.params.id;
    const userId = req.user.id;
    
    // Find the bug to check workspace permissions
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }
    
    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(bug.workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update bugs in this workspace",
      });
    }
    
    const {
      title,
      description,
      task_id,
      assigned_to,
      status,
      severity,
      steps_to_reproduce,
      expected_behavior,
      actual_behavior
    } = req.body;
    
    // Keep track of status change
    const statusChanged = status && status !== bug.status;
    const previousStatus = bug.status;
    
    // Keep track of whether assignment changed
    const assignmentChanged = assigned_to && bug.assigned_to && 
                            assigned_to.toString() !== bug.assigned_to.toString();
    const previousAssignee = bug.assigned_to;
    
    // If task_id provided and changed, verify it exists and belongs to the workspace
    if (task_id && (!bug.task_id || task_id.toString() !== bug.task_id.toString())) {
      const task = await Task.findById(task_id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }
      if (task.workspace_id.toString() !== bug.workspace_id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Task does not belong to the specified workspace",
        });
      }
    }
    
    // Update bug
    const updatedBug = await Bug.findByIdAndUpdate(
      bugId,
      {
        title: title || bug.title,
        description: description !== undefined ? description : bug.description,
        task_id: task_id || bug.task_id,
        assigned_to: assigned_to || bug.assigned_to,
        status: status || bug.status,
        severity: severity || bug.severity,
        steps_to_reproduce: steps_to_reproduce !== undefined ? steps_to_reproduce : bug.steps_to_reproduce,
        expected_behavior: expected_behavior !== undefined ? expected_behavior : bug.expected_behavior,
        actual_behavior: actual_behavior !== undefined ? actual_behavior : bug.actual_behavior,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate("workspace_id")
      .populate("task_id")
      .populate("reported_by")
      .populate("assigned_to");
      
    // Handle notifications for status changes
    const io = req.app.get('io');
    
    // If status changed to Fixed/Closed/Rejected, notify the reporter
    if (statusChanged && 
        (status === "Fixed" || status === "Closed" || status === "Rejected") && 
        bug.reported_by.toString() !== userId) {
      const statusNotification = new Notification({
        user_id: bug.reported_by,
        type: "bug_status_changed",
        type_id: bugId,
        workspace_id: bug.workspace_id,
        content: `Bug "${updatedBug.title}" that you reported has been marked as ${status}`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await statusNotification.save();
      io.to(`user-${bug.reported_by}`).emit('notification:new', await statusNotification.populate("user_id workspace_id"));
    }
    
    // If assigned user changed, notify the new assignee
    if (assignmentChanged) {
      // Notify new assignee
      const assignNotification = new Notification({
        user_id: assigned_to,
        type: "bug_assigned",
        type_id: bugId,
        workspace_id: bug.workspace_id,
        content: `You have been assigned to fix bug "${updatedBug.title}"`,
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
          type: "bug_unassigned",
          type_id: bugId,
          workspace_id: bug.workspace_id,
          content: `You have been unassigned from bug "${updatedBug.title}"`,
          related_id: userId,
          is_read: false,
          created_at: new Date()
        });
        
        await unassignNotification.save();
        io.to(`user-${previousAssignee}`).emit('notification:new', await unassignNotification.populate("user_id workspace_id"));
      }
    }
    
    // Emit to workspace room for real-time updates
    io.to(`workspace-${bug.workspace_id}`).emit('bug:updated', updatedBug);

    return res.status(200).json({
      success: true,
      data: updatedBug,
    });
  } catch (error) {
    console.error("Error updating bug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete a bug
export const deleteBug = async (req, res) => {
  try {
    const bugId = req.params.id;
    const userId = req.user.id;
    
    // Find the bug to check workspace permissions
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }
    
    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(bug.workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete bugs in this workspace",
      });
    }
    
    // Store bug details before deletion for notifications
    const bugTitle = bug.title;
    const workspaceId = bug.workspace_id;
    const reporterId = bug.reported_by;
    const assignedUserId = bug.assigned_to;
    
    // Delete the bug
    await Bug.findByIdAndDelete(bugId);
    
    // Notify the original reporter if they didn't delete it
    const io = req.app.get('io');
    
    if (reporterId.toString() !== userId) {
      const reporterNotification = new Notification({
        user_id: reporterId,
        type: "bug_deleted",
        type_id: null,
        workspace_id: workspaceId,
        content: `Bug "${bugTitle}" that you reported has been deleted`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await reporterNotification.save();
      io.to(`user-${reporterId}`).emit('notification:new', await reporterNotification.populate("user_id workspace_id"));
    }
    
    // If bug was assigned to someone, notify them
    if (assignedUserId && assignedUserId.toString() !== userId && assignedUserId.toString() !== reporterId.toString()) {
      const assigneeNotification = new Notification({
        user_id: assignedUserId,
        type: "bug_deleted",
        type_id: null,
        workspace_id: workspaceId,
        content: `Bug "${bugTitle}" that was assigned to you has been deleted`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await assigneeNotification.save();
      io.to(`user-${assignedUserId}`).emit('notification:new', await assigneeNotification.populate("user_id workspace_id"));
    }
    
    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspaceId}`).emit('bug:deleted', {
      bugId,
      workspaceId,
      message: `Bug "${bugTitle}" has been deleted`
    });

    return res.status(200).json({
      success: true,
      message: "Bug deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add a comment to a bug
export const addComment = async (req, res) => {
  try {
    const bugId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;
    
    // Find the bug
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: "Bug not found",
      });
    }
    
    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(bug.workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to comment on bugs in this workspace",
      });
    }
    
    // Create new comment
    const newComment = {
      user_id: userId,
      content,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Add comment to bug
    bug.comments.push(newComment);
    
    await bug.save();
    
    // Get populated bug with populated comments
    const updatedBug = await Bug.findById(bugId)
      .populate("workspace_id")
      .populate("task_id")
      .populate("reported_by")
      .populate("assigned_to")
      .populate("comments.user_id");
    
    // Notify relevant users
    const io = req.app.get('io');
    
    // Notify bug reporter if they're not the commenter
    if (bug.reported_by.toString() !== userId) {
      const reporterNotification = new Notification({
        user_id: bug.reported_by,
        type: "bug_comment",
        type_id: bugId,
        workspace_id: bug.workspace_id,
        content: `New comment on bug "${bug.title}" that you reported`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await reporterNotification.save();
      io.to(`user-${bug.reported_by}`).emit('notification:new', await reporterNotification.populate("user_id workspace_id"));
    }
    
    // Notify assignee if exists and isn't the commenter or reporter
    if (bug.assigned_to && 
        bug.assigned_to.toString() !== userId && 
        bug.assigned_to.toString() !== bug.reported_by.toString()) {
      const assigneeNotification = new Notification({
        user_id: bug.assigned_to,
        type: "bug_comment",
        type_id: bugId,
        workspace_id: bug.workspace_id,
        content: `New comment on bug "${bug.title}" assigned to you`,
        related_id: userId,
        is_read: false,
        created_at: new Date()
      });
      
      await assigneeNotification.save();
      io.to(`user-${bug.assigned_to}`).emit('notification:new', await assigneeNotification.populate("user_id workspace_id"));
    }
    
    // Emit to workspace room for real-time updates
    io.to(`workspace-${bug.workspace_id}`).emit('bug:commented', {
      bug: updatedBug,
      comment: updatedBug.comments[updatedBug.comments.length - 1]
    });

    return res.status(200).json({
      success: true,
      data: updatedBug.comments[updatedBug.comments.length - 1],
    });
  } catch (error) {
    console.error("Error adding comment to bug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}; 