import Sprint from "../models/model_database/sprints.js";
import Task from "../models/model_database/tasks.js";
import Epic from "../models/model_database/epics.js";
import Workspace from "../models/model_database/workspaces.js";
import Notification from "../models/model_database/notifications.js";
import { checkWorkspacePermission } from "../helper/checkRole.js";

// Get all sprints with pagination and filtering
export const getAllSprints = async (req, res) => {
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

    const sprints = await Sprint.find(query)
      .populate("workspace_id")
      .populate("created_by")
      .skip(skip)
      .limit(limit)
      .sort({ start_date: -1 });

    const total = await Sprint.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: sprints.length,
      total,
      data: sprints,
    });
  } catch (error) {
    console.error("Error fetching sprints:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get sprint by ID
export const getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id)
      .populate("workspace_id")
      .populate("created_by")
      .populate({
        path: "tasks",
        populate: [
          { path: "assigned_to", model: "User" },
          { path: "epic_id", model: "Epic" },
        ],
      });

    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: "Sprint not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: sprint,
    });
  } catch (error) {
    console.error("Error fetching sprint:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get sprints by user ID
export const getSprintByIdUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all tasks assigned to this user
    const userTasks = await Task.find({ assigned_to: userId });

    // Get unique sprint IDs from these tasks
    const sprintIds = [
      ...new Set(
        userTasks
          .filter((task) => task.sprint_id)
          .map((task) => task.sprint_id.toString())
      ),
    ];

    // Find sprints by these IDs
    const sprints = await Sprint.find({ _id: { $in: sprintIds } })
      .populate("workspace_id")
      .populate("created_by")
      .populate({
        path: "tasks",
        populate: [
          { path: "assigned_to", model: "User" },
          { path: "epic_id", model: "Epic" },
        ],
      });

    return res.status(200).json({
      success: true,
      count: sprints.length,
      data: sprints,
    });
  } catch (error) {
    console.error("Error fetching user sprints:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new sprint
export const createSprint = async (req, res) => {
  try {
    const {
      name,
      description,
      workspace_id,
      start_date,
      end_date,
      goal,
      status,
    } = req.body;

    const userId = req.user.id;

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to create sprints in this workspace",
      });
    }

    const newSprint = new Sprint({
      name,
      description,
      workspace_id,
      created_by: userId,
      start_date,
      end_date,
      goal,
      status: status || "Planned",
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedSprint = await newSprint.save();

    // Populate the created sprint
    const populatedSprint = await Sprint.findById(savedSprint._id)
      .populate("workspace_id")
      .populate("created_by");

    // Get workspace members with Leader or Manager role
    const workspace = await Workspace.findById(workspace_id);
    const managementMembers = workspace.members.filter(
      (member) =>
        ["Leader", "Manager"].includes(member.role) &&
        member.user_id.toString() !== userId
    );

    // Notify management members
    const io = req.app.get("io");

    for (const member of managementMembers) {
      const notification = new Notification({
        user_id: member.user_id,
        type: "sprint_created",
        type_id: savedSprint._id,
        workspace_id: workspace_id,
        content: `New sprint "${name}" has been created in ${workspace.name}`,
        related_id: userId,
        is_read: false,
        created_at: new Date(),
      });

      await notification.save();
      const populatedNotification = await notification.populate(
        "user_id workspace_id"
      );
      io.to(`user-${member.user_id}`).emit(
        "notification:new",
        populatedNotification
      );
    }

    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspace_id}`).emit("sprint:created", populatedSprint);

    return res.status(201).json({
      success: true,
      data: populatedSprint,
    });
  } catch (error) {
    console.error("Error creating sprint:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a sprint
export const updateSprint = async (req, res) => {
  try {
    const sprintId = req.params.id;
    const userId = req.user.id;

    // Find the sprint to check workspace permissions
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: "Sprint not found",
      });
    }

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(
      sprint.workspace_id,
      userId
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to update sprints in this workspace",
      });
    }

    const { name, description, start_date, end_date, goal, status } = req.body;

    // Keep track of whether status changed to Active
    const statusChangedToActive =
      status === "Active" && sprint.status !== "Active";

    // Update sprint
    const updatedSprint = await Sprint.findByIdAndUpdate(
      sprintId,
      {
        name: name || sprint.name,
        description:
          description !== undefined ? description : sprint.description,
        start_date: start_date || sprint.start_date,
        end_date: end_date || sprint.end_date,
        goal: goal !== undefined ? goal : sprint.goal,
        status: status || sprint.status,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("workspace_id")
      .populate("created_by");

    // Handle notifications for status changes
    const io = req.app.get("io");

    // If status changed to Active, notify workspace members
    if (statusChangedToActive) {
      const workspace = await Workspace.findById(sprint.workspace_id);

      // Notify all workspace members
      for (const member of workspace.members) {
        // Skip the current user
        if (member.user_id.toString() === userId) continue;

        const notification = new Notification({
          user_id: member.user_id,
          type: "sprint_started",
          type_id: sprintId,
          workspace_id: sprint.workspace_id,
          content: `Sprint "${updatedSprint.name}" has started in ${workspace.name}`,
          related_id: userId,
          is_read: false,
          created_at: new Date(),
        });

        await notification.save();
        const populatedNotification = await notification.populate(
          "user_id workspace_id"
        );
        io.to(`user-${member.user_id}`).emit(
          "notification:new",
          populatedNotification
        );
      }
    }

    // If status changed to Completed, update tasks and epics status and notify
    if (status === "Completed" && sprint.status !== "Completed") {
      // Notify management members
      const workspace = await Workspace.findById(sprint.workspace_id);
      const managementMembers = workspace.members.filter(
        (member) =>
          ["Leader", "Manager"].includes(member.role) &&
          member.user_id.toString() !== userId
      );

      for (const member of managementMembers) {
        const notification = new Notification({
          user_id: member.user_id,
          type: "sprint_completed",
          type_id: sprintId,
          workspace_id: sprint.workspace_id,
          content: `Sprint "${updatedSprint.name}" has been completed in ${workspace.name}`,
          related_id: userId,
          is_read: false,
          created_at: new Date(),
        });

        await notification.save();
        const populatedNotification = await notification.populate(
          "user_id workspace_id"
        );
        io.to(`user-${member.user_id}`).emit(
          "notification:new",
          populatedNotification
        );
      }
    }

    // Emit to workspace room for real-time updates
    io.to(`workspace-${sprint.workspace_id}`).emit(
      "sprint:updated",
      updatedSprint
    );

    return res.status(200).json({
      success: true,
      data: updatedSprint,
    });
  } catch (error) {
    console.error("Error updating sprint:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a sprint
export const deleteSprint = async (req, res) => {
  try {
    const sprintId = req.params.id;
    const userId = req.user.id;

    // Find the sprint to check workspace permissions
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: "Sprint not found",
      });
    }

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(
      sprint.workspace_id,
      userId
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to delete sprints in this workspace",
      });
    }

    // Store sprint details before deletion for notifications
    const sprintName = sprint.name;
    const workspaceId = sprint.workspace_id;

    // Update any tasks that reference this sprint
    await Task.updateMany({ sprint_id: sprintId }, { sprint_id: null });

    // Delete the sprint
    await Sprint.findByIdAndDelete(sprintId);

    // Get workspace members with Leader or Manager role
    const workspace = await Workspace.findById(workspaceId);
    const managementMembers = workspace.members.filter(
      (member) =>
        ["Leader", "Manager"].includes(member.role) &&
        member.user_id.toString() !== userId
    );

    // Notify management members
    const io = req.app.get("io");

    for (const member of managementMembers) {
      const notification = new Notification({
        user_id: member.user_id,
        type: "sprint_deleted",
        type_id: null,
        workspace_id: workspaceId,
        content: `Sprint "${sprintName}" has been deleted from ${workspace.name}`,
        related_id: userId,
        is_read: false,
        created_at: new Date(),
      });

      await notification.save();
      const populatedNotification = await notification.populate(
        "user_id workspace_id"
      );
      io.to(`user-${member.user_id}`).emit(
        "notification:new",
        populatedNotification
      );
    }

    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspaceId}`).emit("sprint:deleted", {
      sprintId,
      workspaceId,
      message: `Sprint "${sprintName}" has been deleted`,
    });

    return res.status(200).json({
      success: true,
      message: "Sprint deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sprint:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add tasks to sprint
export const addItems = async (req, res) => {
  try {
    const sprintId = req.params.id;
    const { tasks } = req.body;
    const userId = req.user.id;

    // Find the sprint to check workspace permissions
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: "Sprint not found",
      });
    }

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(
      sprint.workspace_id,
      userId
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to modify sprints in this workspace",
      });
    }

    // Add tasks to sprint
    if (tasks && tasks.length > 0) {
      // Update task references to this sprint
      await Task.updateMany({ _id: { $in: tasks } }, { sprint_id: sprintId });

      // Add tasks to sprint
      await Sprint.findByIdAndUpdate(sprintId, {
        $addToSet: { tasks: { $each: tasks } },
      });
    }

    // Get the updated sprint
    const updatedSprint = await Sprint.findById(sprintId)
      .populate("workspace_id")
      .populate("created_by")
      .populate({
        path: "tasks",
        populate: [
          { path: "assigned_to", model: "User" },
          { path: "epic_id", model: "Epic" },
        ],
      });

    // Emit to workspace room for real-time updates
    const io = req.app.get("io");
    io.to(`workspace-${sprint.workspace_id}`).emit(
      "sprint:updated",
      updatedSprint
    );

    return res.status(200).json({
      success: true,
      data: updatedSprint,
    });
  } catch (error) {
    console.error("Error adding items to sprint:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove tasks from sprint
export const removeItems = async (req, res) => {
  try {
    const sprintId = req.params.id;
    const { tasks } = req.body;
    const userId = req.user.id;

    // Find the sprint to check workspace permissions
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: "Sprint not found",
      });
    }

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(
      sprint.workspace_id,
      userId
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to modify sprints in this workspace",
      });
    }

    // Remove tasks from sprint
    if (tasks && tasks.length > 0) {
      // Update task references to remove sprint
      await Task.updateMany({ _id: { $in: tasks } }, { sprint_id: null });

      // Remove tasks from sprint
      await Sprint.findByIdAndUpdate(sprintId, {
        $pull: { tasks: { $in: tasks } },
      });
    }

    // Get the updated sprint
    const updatedSprint = await Sprint.findById(sprintId)
      .populate("workspace_id")
      .populate("created_by")
      .populate({
        path: "tasks",
        populate: [
          { path: "assigned_to", model: "User" },
          { path: "epic_id", model: "Epic" },
        ],
      });

    // Emit to workspace room for real-time updates
    const io = req.app.get("io");
    io.to(`workspace-${sprint.workspace_id}`).emit(
      "sprint:updated",
      updatedSprint
    );

    return res.status(200).json({
      success: true,
      data: updatedSprint,
    });
  } catch (error) {
    console.error("Error removing items from sprint:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
