import Task from "../models/model_database/tasks.js";
import mongoose from "mongoose";

// Helper function to get start and end dates of a week
const getWeekDates = (dateString) => {
  const date = dateString ? new Date(dateString) : new Date();
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Calculate start of week (Monday)
  const startOfWeek = new Date(date);
  const diffToMonday = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days, otherwise go to Monday
  startOfWeek.setDate(date.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Calculate end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { startOfWeek, endOfWeek };
};

// Get weekly completed tasks for a specific user
export const getWeeklyCompletedTasksByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { week } = req.query; // Optional: Can provide a specific week
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    
    // Get start and end of the week dates
    const { startOfWeek, endOfWeek } = getWeekDates(week);
    
    // Query for completed tasks in the specified week
    const completedTasks = await Task.find({
      assigned_to: userId,
      status: "Done",
      completed_date: { $gte: startOfWeek, $lte: endOfWeek }
    })
    .populate("workspace_id", "name")
    .populate("epic_id", "title")
    .populate("sprint_id", "name")
    .sort({ completed_date: -1 });
    
    // Group tasks by day
    const tasksByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };
    
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    completedTasks.forEach(task => {
      const completedDate = new Date(task.completed_date);
      const dayName = dayNames[completedDate.getDay()];
      tasksByDay[dayName].push(task);
    });
    
    // Calculate total spent hours
    const totalSpentHours = completedTasks.reduce((total, task) => total + (task.spent_hours || 0), 0);
    
    // Prepare workspace stats
    const workspaceStats = {};
    completedTasks.forEach(task => {
      const workspaceId = task.workspace_id?._id?.toString() || 'unknown';
      const workspaceName = task.workspace_id?.name || 'Unknown Workspace';
      
      if (!workspaceStats[workspaceId]) {
        workspaceStats[workspaceId] = {
          name: workspaceName,
          taskCount: 0,
          spentHours: 0
        };
      }
      
      workspaceStats[workspaceId].taskCount += 1;
      workspaceStats[workspaceId].spentHours += (task.spent_hours || 0);
    });
    
    return res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startOfWeek,
          endDate: endOfWeek
        },
        summary: {
          totalTasks: completedTasks.length,
          totalSpentHours: totalSpentHours
        },
        tasksByDay,
        workspaceStats: Object.values(workspaceStats),
        tasks: completedTasks
      }
    });
  } catch (error) {
    console.error("Error fetching weekly completed tasks:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get weekly completed tasks summary for all users in a workspace
export const getWorkspaceWeeklyTaskSummary = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;
    const { week } = req.query; // Optional: Can provide a specific week
    
    // Validate workspaceId format
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID format",
      });
    }
    
    // Get start and end of the week dates
    const { startOfWeek, endOfWeek } = getWeekDates(week);
    
    // Query for all completed tasks in the workspace for the specified week
    const completedTasks = await Task.find({
      workspace_id: workspaceId,
      status: "Done",
      completed_date: { $gte: startOfWeek, $lte: endOfWeek }
    })
    .populate("assigned_to", "name avatar")
    .populate("epic_id", "title")
    .populate("sprint_id", "name")
    .sort({ completed_date: -1 });
    
    // Group tasks by user
    const tasksByUser = {};
    
    completedTasks.forEach(task => {
      const userId = task.assigned_to?._id?.toString() || 'unassigned';
      const userName = task.assigned_to?.name || 'Unassigned';
      
      if (!tasksByUser[userId]) {
        tasksByUser[userId] = {
          userId,
          userName,
          avatar: task.assigned_to?.avatar || null,
          taskCount: 0,
          spentHours: 0,
          tasks: []
        };
      }
      
      tasksByUser[userId].taskCount += 1;
      tasksByUser[userId].spentHours += (task.spent_hours || 0);
      tasksByUser[userId].tasks.push(task);
    });
    
    return res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startOfWeek,
          endDate: endOfWeek
        },
        summary: {
          totalTasks: completedTasks.length,
          totalUsers: Object.keys(tasksByUser).length
        },
        userStats: Object.values(tasksByUser)
      }
    });
  } catch (error) {
    console.error("Error fetching workspace weekly task summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
