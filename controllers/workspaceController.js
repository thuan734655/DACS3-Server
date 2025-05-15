import Workspace from "../models/model_database/workspaces.js";
import Notification from "../models/model_database/notifications.js";
import mongoose from "mongoose";

// Helper function to check if user has specific roles in workspace
const checkUserRole = (workspace, userId, allowedRoles) => {
  const member = workspace.members.find(
    member => member.user_id.toString() === userId
  );
  
  if (!member) {
    return false;
  }
  
  return allowedRoles.includes(member.role);
};

// Get all workspaces with pagination
export const getAllWorkspaces = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const workspaces = await Workspace.find()
      .populate("created_by")
      .populate("members.user_id")
      .skip(skip)
      .limit(limit);

    const total = await Workspace.countDocuments();

    return res.status(200).json({
      success: true,
      count: workspaces.length,
      total,
      data: workspaces,
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all workspaces by user ID
export const getAllWorkspacesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find all workspaces where the user is a member
    const workspaces = await Workspace.find({
      'members.user_id': userId
    })
      .populate("created_by")
      .populate("members.user_id")
      .skip(skip)
      .limit(limit);

    const total = await Workspace.countDocuments({
      'members.user_id': userId
    });

    return res.status(200).json({
      success: true,
      count: workspaces.length,
      total,
      data: workspaces,
    });
  } catch (error) {
    console.error("Error fetching user workspaces:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get workspace by ID
export const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("created_by")
      .populate("members.user_id");

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Create a new workspace
export const createWorkspace = async (req, res) => {
  try {
    const { name, description, created_by } = req.body;

    const newWorkspace = new Workspace({
      name,
      description,
      created_by,
      members: [{ user_id: created_by, role: "Leader" }],
    });

    const savedWorkspace = await newWorkspace.save();
    
    // Populate the created workspace
    const populatedWorkspace = await Workspace.findById(savedWorkspace._id)
      .populate("created_by")
      .populate("members.user_id");

    // Emit socket event for workspace creation
    const io = req.app.get('io');
    io.to(`user-${created_by}`).emit('workspace:created', populatedWorkspace);

    return res.status(201).json({
      success: true,
      data: populatedWorkspace,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update a workspace
export const updateWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Find the workspace first to check permissions
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }
    
    // Check if the user is the leader (creator) of the workspace
    if (workspace.created_by.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the workspace leader can update this workspace",
      });
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
      },
      { new: true, runValidators: true }
    )
      .populate("created_by")
      .populate("members.user_id");

    // Emit socket event for workspace update
    const io = req.app.get('io');
    
    // Create notifications for workspace members (except the updater)
    const workspaceMembers = updatedWorkspace.members || [];
    
    // Filter out the user who made the update
    const membersToNotify = workspaceMembers.filter(
      member => member.user_id._id.toString() !== req.user.id
    );
    
    // Create and send notifications in parallel
    const notificationPromises = membersToNotify.map(async (member) => {
      const newNotification = new Notification({
        user_id: member.user_id._id,
        type: "workspace_updated",
        type_id: updatedWorkspace._id,
        workspace_id: updatedWorkspace._id,
        content: `Workspace "${updatedWorkspace.name}" has been updated`,
        related_id: req.user.id,
        is_read: false,
        created_at: new Date()
      });
      
      await newNotification.save();
      const populatedNotification = await newNotification.populate("user_id workspace_id");
      
      // Send notification to each workspace member
      io.to(`user-${member.user_id._id}`).emit('notification:new', populatedNotification);
    });
    
    await Promise.all(notificationPromises);
    
    // Also emit workspace:updated event for real-time UI updates
    updatedWorkspace.members.forEach(member => {
      io.to(`user-${member.user_id._id}`).emit('workspace:updated', updatedWorkspace);
    });

    return res.status(200).json({
      success: true,
      data: updatedWorkspace,
    });
  } catch (error) {
    console.error("Error updating workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete a workspace
export const deleteWorkspace = async (req, res) => {
  try {
    const userId = req.user.id;
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }
    
    // Check if the user is the creator of the workspace
    if (workspace.created_by.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the workspace leader can delete this workspace",
      });
    }
    
    // Store members for notification before deletion
    const members = workspace.members;
    const workspaceId = workspace._id;
    const workspaceName = workspace.name;
    
    // Delete the workspace
    await Workspace.findByIdAndDelete(req.params.id);

    // Create notifications for workspace members (except the deleter)
    const membersToNotify = members.filter(
      member => member.user_id.toString() !== req.user.id
    );

    // Emit socket event for workspace deletion
    const io = req.app.get('io');
    
    // Create and send notifications in parallel
    const notificationPromises = membersToNotify.map(async (member) => {
      const newNotification = new Notification({
        user_id: member.user_id,
        type: "workspace_deleted",
        type_id: null, // Workspace no longer exists
        workspace_id: null, // Workspace no longer exists
        content: `Workspace "${workspaceName}" has been deleted`,
        related_id: req.user.id,
        is_read: false,
        created_at: new Date()
      });
      
      await newNotification.save();
      const populatedNotification = await newNotification.populate("user_id");
      
      // Send notification to each former workspace member
      io.to(`user-${member.user_id}`).emit('notification:new', populatedNotification);
    });
    
    await Promise.all(notificationPromises);
    
    // Also emit workspace:deleted event for real-time UI updates
    members.forEach(member => {
      io.to(`user-${member.user_id}`).emit('workspace:deleted', {
        workspaceId,
        message: `Workspace "${workspaceName}" has been deleted`
      });
    });

    return res.status(200).json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add member to workspace
export const addMember = async (req, res) => {
  try {
    const { user_id, role } = req.body;
    const userId = req.user.id;
    
    // Check if workspace exists
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }
    
    // Check if the current user has permission (Leader or Manager only)
    if (!checkUserRole(workspace, userId, ['Leader', 'Manager'])) {
      return res.status(403).json({
        success: false,
        message: "Only workspace leaders and managers can add members",
      });
    }
    
    // Check if user is already a member
    const memberExists = workspace.members.some(
      member => member.user_id.toString() === user_id
    );
    
    if (memberExists) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this workspace",
      });
    }
    
    // Add member
    workspace.members.push({
      user_id,
      role: role || "Member",
    });
    
    await workspace.save();
    
    // Get populated workspace
    const updatedWorkspace = await Workspace.findById(req.params.id)
      .populate("created_by")
      .populate("members.user_id");
    
    // Create notification for the added user
    const newNotification = new Notification({
      user_id: user_id,
      type: "workspace_added",
      type_id: workspace._id,
      workspace_id: workspace._id,
      content: `You have been added to workspace "${workspace.name}"`,
      related_id: req.user.id, // The user who performed the addition
      is_read: false,
      created_at: new Date()
    });
    
    await newNotification.save();
    
    // Emit socket event for member addition
    const io = req.app.get('io');
    
    // Notify the new member with both a notification and workspace join event
    io.to(`user-${user_id}`).emit('notification:new', await newNotification.populate("user_id workspace_id"));
    io.to(`user-${user_id}`).emit('workspace:joined', updatedWorkspace);
    
    // Notify all existing members about the new member
    updatedWorkspace.members.forEach(member => {
      if (member.user_id._id.toString() !== user_id) {
        io.to(`user-${member.user_id._id}`).emit('workspace:memberAdded', {
          workspace: updatedWorkspace,
          newMember: user_id
        });
      }
    });
    
    return res.status(200).json({
      success: true,
      data: updatedWorkspace,
    });
  } catch (error) {
    console.error("Error adding member to workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Remove member from workspace
export const removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetUserId = req.params.userId;
    
    // Check if workspace exists
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }
    
    // Check if the current user has permission (Leader or Manager only)
    if (!checkUserRole(workspace, userId, ['Leader', 'Manager'])) {
      return res.status(403).json({
        success: false,
        message: "Only workspace leaders and managers can remove members",
      });
    }
    
    // Check if the user to be removed is the creator
    if (workspace.created_by.toString() === targetUserId) {
      return res.status(403).json({
        success: false,
        message: "Cannot remove the workspace leader. The leader should delete the workspace instead.",
      });
    }
    
    // If the current user is a manager, check that they're not trying to remove another manager or leader
    if (checkUserRole(workspace, userId, ['Manager'])) {
      const targetUser = workspace.members.find(member => member.user_id.toString() === targetUserId);
      if (targetUser && (targetUser.role === 'Leader' || targetUser.role === 'Manager')) {
        return res.status(403).json({
          success: false,
          message: "Managers cannot remove leaders or other managers from the workspace",
        });
      }
    }
    
    // Check if user is a member
    const memberIndex = workspace.members.findIndex(
      member => member.user_id.toString() === targetUserId
    );
    
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this workspace",
      });
    }
    
    // Save the member before removal for socket notification
    const removedMember = workspace.members[memberIndex];
    const workspaceName = workspace.name;
    
    // Remove member
    workspace.members.splice(memberIndex, 1);
    await workspace.save();
    
    // Get populated workspace
    const updatedWorkspace = await Workspace.findById(req.params.id)
      .populate("created_by")
      .populate("members.user_id");
    
    // Create notification for the removed user
    const removalNotification = new Notification({
      user_id: targetUserId,
      type: "workspace_removed",
      type_id: workspace._id,
      workspace_id: null, // User no longer has access to this workspace
      content: `You have been removed from workspace "${workspaceName}"`,
      related_id: req.user.id, // The user who performed the removal
      is_read: false,
      created_at: new Date()
    });
    
    await removalNotification.save();
    
    // Emit socket event for member removal
    const io = req.app.get('io');
    
    // Notify the removed member
    io.to(`user-${targetUserId}`).emit('notification:new', await removalNotification.populate("user_id"));
    io.to(`user-${targetUserId}`).emit('workspace:removed', {
      workspaceId: workspace._id,
      message: `You have been removed from workspace "${workspaceName}"`
    });
    
    // Notify all remaining members about the removal
    updatedWorkspace.members.forEach(member => {
      io.to(`user-${member.user_id._id}`).emit('workspace:memberRemoved', {
        workspace: updatedWorkspace,
        removedMember: targetUserId
      });
    });
    
    return res.status(200).json({
      success: true,
      data: updatedWorkspace,
    });
  } catch (error) {
    console.error("Error removing member from workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Join a workspace
export const joinWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const userId = req.user.id; // Get the user ID from the authenticated user
    
    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }
    
    // Check if the workspace is public or if the user has an invitation
    // This is a placeholder - you would need to implement an invitation system
    // For now, we'll allow any user to join a workspace
    
    // Check if user is already a member
    const memberExists = workspace.members.some(
      member => member.user_id.toString() === userId
    );
    
    if (memberExists) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this workspace",
      });
    }
    
    // Add member
    workspace.members.push({
      user_id: userId,
      role: "Member", // Default role for self-join
    });
    
    await workspace.save();
    
    // Get populated workspace
    const updatedWorkspace = await Workspace.findById(workspaceId)
      .populate("created_by")
      .populate("members.user_id");
    
    // Create notification for workspace owner
    const ownerNotification = new Notification({
      user_id: workspace.created_by,
      type: "workspace_join",
      type_id: workspaceId,
      workspace_id: workspaceId,
      content: `${req.user.name || "A new user"} joined workspace "${workspace.name}"`,
      related_id: userId,
      is_read: false,
      created_at: new Date()
    });
    
    await ownerNotification.save();
    
    // Emit socket event for member addition
    const io = req.app.get('io');
    
    // Notify workspace owner about the new member
    io.to(`user-${workspace.created_by}`).emit('notification:new', await ownerNotification.populate("user_id workspace_id"));
    
    // Notify all existing members
    updatedWorkspace.members.forEach(member => {
      if (member.user_id._id.toString() !== userId) {
        io.to(`user-${member.user_id._id}`).emit('workspace:memberAdded', {
          workspace: updatedWorkspace,
          newMember: userId
        });
      }
    });
    
    return res.status(200).json({
      success: true,
      data: updatedWorkspace,
    });
  } catch (error) {
    console.error("Error joining workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Leave a workspace
export const leaveWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const userId = req.user.id;
    
    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }
    
    // Check if user is the creator of the workspace
    if (workspace.created_by.toString() === userId) {
      return res.status(403).json({
        success: false,
        message: "The workspace creator cannot leave the workspace. Transfer ownership or delete the workspace instead.",
      });
    }
    
    // Check if user is a member
    const memberIndex = workspace.members.findIndex(
      member => member.user_id.toString() === userId
    );
    
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this workspace",
      });
    }
    
    // Remove member
    workspace.members.splice(memberIndex, 1);
    await workspace.save();
    
    // Get populated workspace
    const updatedWorkspace = await Workspace.findById(workspaceId)
      .populate("created_by")
      .populate("members.user_id");
    
    // Create notification for workspace owner
    const ownerNotification = new Notification({
      user_id: workspace.created_by,
      type: "workspace_leave",
      type_id: workspaceId,
      workspace_id: workspaceId,
      content: `${req.user.name || "A user"} left workspace "${workspace.name}"`,
      related_id: userId,
      is_read: false,
      created_at: new Date()
    });
    
    await ownerNotification.save();
    
    // Emit socket event for member removal
    const io = req.app.get('io');
    
    // Notify workspace owner
    io.to(`user-${workspace.created_by}`).emit('notification:new', await ownerNotification.populate("user_id workspace_id"));
    
    // Notify all remaining members
    updatedWorkspace.members.forEach(member => {
      io.to(`user-${member.user_id._id}`).emit('workspace:memberRemoved', {
        workspace: updatedWorkspace,
        removedMember: userId
      });
    });
    
    return res.status(200).json({
      success: true,
      message: "You have successfully left the workspace",
    });
  } catch (error) {
    console.error("Error leaving workspace:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}; 