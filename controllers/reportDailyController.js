import ReportDaily from "../models/model_database/reportDaily.js";
import Task from "../models/model_database/tasks.js";
import Workspace from "../models/model_database/workspaces.js";
import Notification from "../models/model_database/notifications.js";
import { checkWorkspacePermission } from "../helper/checkRole.js";

// Get all daily reports with pagination and filtering
export const getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by workspace_id if provided
    if (req.query.workspace_id) {
      query.workspace_id = req.query.workspace_id;
    }

    // Filter by user_id if provided
    if (req.query.user_id) {
      query.user_id = req.query.user_id;
    }

    // Filter by date range if provided
    if (req.query.start_date && req.query.end_date) {
      query.date = {
        $gte: new Date(req.query.start_date),
        $lte: new Date(req.query.end_date),
      };
    } else if (req.query.start_date) {
      query.date = { $gte: new Date(req.query.start_date) };
    } else if (req.query.end_date) {
      query.date = { $lte: new Date(req.query.end_date) };
    }

    const reports = await ReportDaily.find(query)
      .populate("user_id")
      .populate("workspace_id")
      .populate("completed_tasks.task_id")
      .populate("in_progress_tasks.task_id")
      .populate("planned_tasks.task_id")
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    const total = await ReportDaily.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: reports.length,
      total,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching daily reports:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get reports by user ID (for current user)
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { user_id: userId };

    // Filter by workspace_id if provided
    if (req.query.workspace_id) {
      query.workspace_id = req.query.workspace_id;
    }

    // Filter by date range if provided
    if (req.query.start_date && req.query.end_date) {
      query.date = {
        $gte: new Date(req.query.start_date),
        $lte: new Date(req.query.end_date),
      };
    } else if (req.query.start_date) {
      query.date = { $gte: new Date(req.query.start_date) };
    } else if (req.query.end_date) {
      query.date = { $lte: new Date(req.query.end_date) };
    }

    const reports = await ReportDaily.find(query)
      .populate("user_id")
      .populate("workspace_id")
      .populate("completed_tasks.task_id")
      .populate("in_progress_tasks.task_id")
      .populate("planned_tasks.task_id")
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    const total = await ReportDaily.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: reports.length,
      total,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching user daily reports:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get reports by specific date
export const getReportsByDate = async (req, res) => {
  try {
    const { date, workspace_id } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }
    
    const queryDate = new Date(date);
    // Format date to remove time component (just keep year, month, day)
    queryDate.setHours(0, 0, 0, 0);
    
    // Set end of day for query range
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const query = {
      date: {
        $gte: queryDate,
        $lt: nextDay
      }
    };
    
    // Filter by workspace_id if provided
    if (workspace_id) {
      query.workspace_id = workspace_id;
      
      // Check if user has permission in this workspace
      const hasPermission = await checkWorkspacePermission(workspace_id, req.user.id);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view reports in this workspace",
        });
      }
    }
    
    const reports = await ReportDaily.find(query)
      .populate("user_id")
      .populate("workspace_id")
      .populate("completed_tasks.task_id")
      .populate("in_progress_tasks.task_id")
      .populate("planned_tasks.task_id")
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
      date: queryDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error("Error fetching reports by date:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get report by ID
export const getReportById = async (req, res) => {
  try {
    const report = await ReportDaily.findById(req.params.id)
      .populate("user_id")
      .populate("workspace_id")
      .populate("completed_tasks.task_id")
      .populate("in_progress_tasks.task_id")
      .populate("planned_tasks.task_id");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Daily report not found",
      });
    }

    // Check if the user has access to this report (created by them or has workspace permission)
    const userId = req.user.id;
    if (report.user_id._id.toString() !== userId) {
      const hasPermission = await checkWorkspacePermission(
        report.workspace_id._id,
        userId
      );
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this report",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching daily report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Create or update daily report
export const createOrUpdateReport = async (req, res) => {
  try {
    const {
      workspace_id,
      date,
      completed_tasks,
      in_progress_tasks,
      planned_tasks,
      issues,
      general_notes,
    } = req.body;

    const userId = req.user.id;
    const reportDate = date ? new Date(date) : new Date();

    // Format date to remove time component (just keep year, month, day)
    reportDate.setHours(0, 0, 0, 0);

    // Check if user has permission in this workspace
    const hasPermission = await checkWorkspacePermission(workspace_id, userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You don't have permission to create reports in this workspace",
      });
    }

    // Check if tasks exist and belong to the workspace
    const validateTasks = async (tasks, fieldName) => {
      if (!tasks || !Array.isArray(tasks)) return;

      for (const taskItem of tasks) {
        if (!taskItem.task_id) {
          return res.status(400).json({
            success: false,
            message: `Missing task_id in ${fieldName}`,
          });
        }

        const task = await Task.findById(taskItem.task_id);
        if (!task) {
          return res.status(404).json({
            success: false,
            message: `Task with ID ${taskItem.task_id} not found in ${fieldName}`,
          });
        }

        if (task.workspace_id.toString() !== workspace_id) {
          return res.status(400).json({
            success: false,
            message: `Task with ID ${taskItem.task_id} does not belong to the specified workspace`,
          });
        }
      }
    };

    // Validate tasks in each category
    const validationErrors = await Promise.all([
      validateTasks(completed_tasks, "completed_tasks"),
      validateTasks(in_progress_tasks, "in_progress_tasks"),
      validateTasks(planned_tasks, "planned_tasks"),
    ]);

    if (validationErrors.some((error) => error)) {
      return; // Error response already sent in validateTasks
    }

    // Try to find an existing report for this user, workspace, and date
    let report = await ReportDaily.findOne({
      user_id: userId,
      workspace_id,
      date: reportDate,
    });

    if (report) {
      // Update existing report
      report.completed_tasks = completed_tasks || report.completed_tasks;
      report.in_progress_tasks = in_progress_tasks || report.in_progress_tasks;
      report.planned_tasks = planned_tasks || report.planned_tasks;
      report.issues = issues || report.issues;
      report.general_notes =
        general_notes !== undefined ? general_notes : report.general_notes;
      report.updated_at = new Date();
    } else {
      // Create new report
      report = new ReportDaily({
        user_id: userId,
        workspace_id,
        date: reportDate,
        completed_tasks: completed_tasks || [],
        in_progress_tasks: in_progress_tasks || [],
        planned_tasks: planned_tasks || [],
        issues: issues || [],
        general_notes,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await report.save();

    // Populate the full report
    const populatedReport = await ReportDaily.findById(report._id)
      .populate("user_id")
      .populate("workspace_id")
      .populate("completed_tasks.task_id")
      .populate("in_progress_tasks.task_id")
      .populate("planned_tasks.task_id");

    // Update spent hours for tasks in completed and in-progress sections
    const updateTaskHours = async () => {
      // For completed tasks
      if (completed_tasks && completed_tasks.length > 0) {
        for (const taskItem of completed_tasks) {
          if (taskItem.task_id && taskItem.spent_hours) {
            const task = await Task.findById(taskItem.task_id);
            if (task) {
              task.spent_hours += taskItem.spent_hours;
              await task.save();
            }
          }
        }
      }

      // For in-progress tasks
      if (in_progress_tasks && in_progress_tasks.length > 0) {
        for (const taskItem of in_progress_tasks) {
          if (taskItem.task_id && taskItem.spent_hours) {
            const task = await Task.findById(taskItem.task_id);
            if (task) {
              task.spent_hours += taskItem.spent_hours;
              await task.save();
            }
          }
        }
      }
    };

    // Only update hours for new reports or if specifically requested
    if (!report._id || req.query.update_hours === "true") {
      await updateTaskHours();
    }

    // Get workspace members with Leader or Manager role
    const workspace = await Workspace.findById(workspace_id);
    const managementMembers = workspace.members.filter(
      (member) =>
        ["Leader", "Manager"].includes(member.role) &&
        member.user_id.toString() !== userId
    );

    // Notify management members about the report
    const io = req.app.get("io");

    for (const member of managementMembers) {
      const notification = new Notification({
        user_id: member.user_id,
        type: "daily_report_submitted",
        type_id: report._id,
        workspace_id,
        content: `${
          populatedReport.user_id.name
        } has submitted a daily report for ${reportDate.toLocaleDateString()}`,
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
    io.to(`workspace-${workspace_id}`).emit(
      "report:submitted",
      populatedReport
    );

    return res.status(201).json({
      success: true,
      data: populatedReport,
      isNew: !report._id,
    });
  } catch (error) {
    console.error("Error creating/updating daily report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete a report
export const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.id;

    // Find the report
    const report = await ReportDaily.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Daily report not found",
      });
    }

    // Check if the user is the creator of the report
    if (report.user_id.toString() !== userId) {
      // If not the creator, check if they have management permission
      const userInWorkspace = await Workspace.findOne({
        _id: report.workspace_id,
        "members.user_id": userId,
        "members.role": { $in: ["Leader", "Manager"] },
      });

      if (!userInWorkspace) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to delete this report",
        });
      }
    }

    // Store report details before deletion for notifications
    const reportDate = report.date;
    const workspaceId = report.workspace_id;
    const reportUserId = report.user_id;

    // Delete the report
    await ReportDaily.findByIdAndDelete(reportId);

    // If a manager deleted someone else's report, notify the report owner
    const io = req.app.get("io");

    if (reportUserId.toString() !== userId) {
      const reporterNotification = new Notification({
        user_id: reportUserId,
        type: "report_deleted",
        type_id: null,
        workspace_id: workspaceId,
        content: `Your daily report for ${reportDate.toLocaleDateString()} has been deleted by a manager`,
        related_id: userId,
        is_read: false,
        created_at: new Date(),
      });

      await reporterNotification.save();
      io.to(`user-${reportUserId}`).emit(
        "notification:new",
        await reporterNotification.populate("user_id workspace_id")
      );
    }

    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspaceId}`).emit("report:deleted", {
      reportId,
      workspaceId,
      userId: reportUserId,
      message: `Daily report for ${reportDate.toLocaleDateString()} has been deleted`,
    });

    return res.status(200).json({
      success: true,
      message: "Daily report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting daily report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
