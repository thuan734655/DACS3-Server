import Task from "../models/model_database/tasks.js";
import Epic from "../models/model_database/epics.js";
import Workspace from "../models/model_database/workspaces.js";
import Notification from "../models/model_database/notifications.js";
import { checkWorkspacePermission } from "../helper/checkRole.js";

// Get all tasks with pagination and filtering
export const getAllTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by workspace_id if provided
    if (req.query.workspace_id) {
      query.workspace_id = req.query.workspace_id;
    }

    // Filter by epic_id if provided
    if (req.query.epic_id) {
      query.epic_id = req.query.epic_id;
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

    // Filter by priority if provided
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const tasks = await Task.find(query)
      .populate("workspace_id")
      .populate("epic_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id")
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    const total = await Task.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("workspace_id")
      .populate("epic_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id")
      .populate("comments.user_id")
      .populate("attachments.uploaded_by");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      workspace_id,
      epic_id,
      assigned_to,
      status,
      priority,
      estimated_hours,
      spent_hours,
      start_date,
      due_date,
      sprint_id,
    } = req.body;

    const userId = req.user.id;

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create tasks in this workspace",
      });
    }

    const newTask = new Task({
      title,
      description,
      workspace_id,
      epic_id: epic_id || null,
      created_by: userId,
      assigned_to: assigned_to || null,
      status: status || "Todo",
      priority: priority || "Medium",
      estimated_hours: estimated_hours || 0,
      spent_hours: spent_hours || 0,
      start_date: start_date || null,
      due_date: due_date || null,
      sprint_id: sprint_id || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedTask = await newTask.save();

    // If this task belongs to an epic, update the epic to include this task
    if (epic_id) {
      await Epic.findByIdAndUpdate(epic_id, {
        $push: { tasks: savedTask._id },
      });
    }

    // Populate the created task
    const populatedTask = await Task.findById(savedTask._id)
      .populate("workspace_id")
      .populate("epic_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id");

    // Create notification for the assigned user if different from creator
    if (assigned_to && assigned_to !== userId) {
      const assignNotification = new Notification({
        user_id: assigned_to,
        type: "task_assigned",
        type_id: savedTask._id,
        workspace_id: workspace_id,
        content: `You have been assigned to task "${title}"`,
        related_id: userId,
        is_read: false,
        created_at: new Date(),
      });

      await assignNotification.save();

      // Emit socket event for notification
      const io = req.app.get("io");
      io.to(`user-${assigned_to}`).emit(
        "notification:new",
        await assignNotification.populate("user_id workspace_id")
      );
    }

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
        type: "task_created",
        type_id: savedTask._id,
        workspace_id: workspace_id,
        content: `New task "${title}" has been created in ${workspace.name}`,
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
    io.to(`workspace-${workspace_id}`).emit("task:created", populatedTask);

    return res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Find the task to check workspace permissions
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(
      task.workspace_id,
      userId
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update tasks in this workspace",
      });
    }

    const {
      title,
      description,
      epic_id,
      assigned_to,
      status,
      priority,
      estimated_hours,
      spent_hours,
      start_date,
      due_date,
      completed_date,
      sprint_id,
    } = req.body;

    // Keep track of whether assignment changed
    const assignmentChanged =
      assigned_to &&
      task.assigned_to &&
      assigned_to.toString() !== task.assigned_to.toString();
    const previousAssignee = task.assigned_to;

    // Keep track of whether epic changed
    const epicChanged =
      epic_id && task.epic_id && epic_id.toString() !== task.epic_id.toString();
    const previousEpic = task.epic_id;

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        title: title || task.title,
        description: description !== undefined ? description : task.description,
        epic_id: epic_id || task.epic_id,
        assigned_to: assigned_to || task.assigned_to,
        status: status || task.status,
        priority: priority || task.priority,
        estimated_hours:
          estimated_hours !== undefined
            ? estimated_hours
            : task.estimated_hours,
        spent_hours: spent_hours !== undefined ? spent_hours : task.spent_hours,
        start_date: start_date || task.start_date,
        due_date: due_date || task.due_date,
        completed_date: completed_date || task.completed_date,
        sprint_id: sprint_id || task.sprint_id,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("workspace_id")
      .populate("epic_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id");

    // If epic changed, update the epic references
    if (epicChanged) {
      if (previousEpic) {
        // Remove task from previous epic
        await Epic.findByIdAndUpdate(previousEpic, {
          $pull: { tasks: taskId },
        });
      }

      if (epic_id) {
        // Add task to new epic
        await Epic.findByIdAndUpdate(epic_id, {
          $push: { tasks: taskId },
        });
      }
    }

    // Handle notifications for assignment changes
    const io = req.app.get("io");

    // If assigned user changed, notify the new assignee
    if (assignmentChanged) {
      // Notify new assignee
      const assignNotification = new Notification({
        user_id: assigned_to,
        type: "task_assigned",
        type_id: taskId,
        workspace_id: task.workspace_id,
        content: `You have been assigned to task "${updatedTask.title}"`,
        related_id: userId,
        is_read: false,
        created_at: new Date(),
      });

      await assignNotification.save();
      io.to(`user-${assigned_to}`).emit(
        "notification:new",
        await assignNotification.populate("user_id workspace_id")
      );

      // Notify previous assignee
      if (previousAssignee) {
        const unassignNotification = new Notification({
          user_id: previousAssignee,
          type: "task_unassigned",
          type_id: taskId,
          workspace_id: task.workspace_id,
          content: `You have been unassigned from task "${updatedTask.title}"`,
          related_id: userId,
          is_read: false,
          created_at: new Date(),
        });

        await unassignNotification.save();
        io.to(`user-${previousAssignee}`).emit(
          "notification:new",
          await unassignNotification.populate("user_id workspace_id")
        );
      }
    }

    // If status changed to "Done", notify management and task creator
    if (status === "Done" && task.status !== "Done") {
      const workspace = await Workspace.findById(task.workspace_id);
      const managementMembers = workspace.members.filter((member) =>
        ["Leader", "Manager"].includes(member.role)
      );

      for (const member of managementMembers) {
        // Skip if this is the current user
        if (member.user_id.toString() === userId) continue;

        const notification = new Notification({
          user_id: member.user_id,
          type: "task_completed",
          type_id: taskId,
          workspace_id: task.workspace_id,
          content: `Task "${updatedTask.title}" has been marked as completed`,
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

      // Also notify the task creator if they're not the current user and not already notified
      if (
        task.created_by.toString() !== userId &&
        !managementMembers.some(
          (member) => member.user_id.toString() === task.created_by.toString()
        )
      ) {
        const creatorNotification = new Notification({
          user_id: task.created_by,
          type: "task_completed",
          type_id: taskId,
          workspace_id: task.workspace_id,
          content: `Task "${updatedTask.title}" that you created has been marked as completed`,
          related_id: userId,
          is_read: false,
          created_at: new Date(),
        });

        await creatorNotification.save();
        io.to(`user-${task.created_by}`).emit(
          "notification:new",
          await creatorNotification.populate("user_id workspace_id")
        );
      }
    }

    // Emit to workspace room for real-time updates
    io.to(`workspace-${task.workspace_id}`).emit("task:updated", updatedTask);

    return res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Find the task to check workspace permissions
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(
      task.workspace_id,
      userId
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete tasks in this workspace",
      });
    }

    // Store task details before deletion for notifications
    const taskTitle = task.title;
    const workspaceId = task.workspace_id;
    const epicId = task.epic_id;
    const assignedUserId = task.assigned_to;

    // If task belongs to an epic, update the epic
    if (epicId) {
      await Epic.findByIdAndUpdate(epicId, {
        $pull: { tasks: taskId },
      });
    }

    // Delete the task
    await Task.findByIdAndDelete(taskId);

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
        type: "task_deleted",
        type_id: null,
        workspace_id: workspaceId,
        content: `Task "${taskTitle}" has been deleted from ${workspace.name}`,
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

    // If task was assigned to someone, notify them
    if (assignedUserId && assignedUserId.toString() !== userId) {
      const assigneeNotification = new Notification({
        user_id: assignedUserId,
        type: "task_deleted",
        type_id: null,
        workspace_id: workspaceId,
        content: `Task "${taskTitle}" that was assigned to you has been deleted`,
        related_id: userId,
        is_read: false,
        created_at: new Date(),
      });

      await assigneeNotification.save();
      io.to(`user-${assignedUserId}`).emit(
        "notification:new",
        await assigneeNotification.populate("user_id workspace_id")
      );
    }

    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspaceId}`).emit("task:deleted", {
      taskId,
      workspaceId,
      epicId,
      message: `Task "${taskTitle}" has been deleted`,
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add a comment to a task
export const addComment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Create new comment
    const newComment = {
      user_id: userId,
      content,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Add comment to task
    task.comments.push(newComment);

    await task.save();

    // Get populated task with populated comments
    const updatedTask = await Task.findById(taskId)
      .populate("workspace_id")
      .populate("epic_id")
      .populate("created_by")
      .populate("assigned_to")
      .populate("sprint_id")
      .populate("comments.user_id");

    // Notify task assignee and creator if they are different from commenter
    const io = req.app.get("io");

    // Notify assignee if exists and isn't the commenter
    if (task.assigned_to && task.assigned_to.toString() !== userId) {
      const assigneeNotification = new Notification({
        user_id: task.assigned_to,
        type: "task_comment",
        type_id: taskId,
        workspace_id: task.workspace_id,
        content: `New comment on task "${task.title}" assigned to you`,
        related_id: userId,
        is_read: false,
        created_at: new Date(),
      });

      await assigneeNotification.save();
      io.to(`user-${task.assigned_to}`).emit(
        "notification:new",
        await assigneeNotification.populate("user_id workspace_id")
      );
    }

    // Notify creator if they aren't the commenter or assignee
    if (
      task.created_by.toString() !== userId &&
      (!task.assigned_to ||
        task.created_by.toString() !== task.assigned_to.toString())
    ) {
      const creatorNotification = new Notification({
        user_id: task.created_by,
        type: "task_comment",
        type_id: taskId,
        workspace_id: task.workspace_id,
        content: `New comment on task "${task.title}" that you created`,
        related_id: userId,
        is_read: false,
        created_at: new Date(),
      });

      await creatorNotification.save();
      io.to(`user-${task.created_by}`).emit(
        "notification:new",
        await creatorNotification.populate("user_id workspace_id")
      );
    }

    // Emit to workspace room for real-time updates
    io.to(`workspace-${task.workspace_id}`).emit("task:commented", {
      task: updatedTask,
      comment: updatedTask.comments[updatedTask.comments.length - 1],
    });

    return res.status(200).json({
      success: true,
      data: updatedTask.comments[updatedTask.comments.length - 1],
    });
  } catch (error) {
    console.error("Error adding comment to task:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
