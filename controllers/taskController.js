import {
  createTaskModel,
  getAllTasksModel,
  getTaskByIdModel,
  updateTaskModel,
  deleteTaskModel
} from "../models/taskModel.js";

const createTaskController = async (req, res) => {
  try {
    const { 
      workspace_id, 
      title, 
      description, 
      assigned_to, 
      due_date, 
      start_date, 
      status 
    } = req.body;
    
    const created_by = req.user.id; // Assuming user ID is available from auth middleware
    
    const taskData = {
      workspace_id,
      title,
      description,
      assigned_to,
      created_by,
      due_date,
      start_date,
      status
    };
    
    const task = await createTaskModel(taskData);
    
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllTasksController = async (req, res) => {
  try {
    const { workspace_id } = req.params;
    const { status, assigned_to } = req.query;
    
    // Build filters based on query parameters
    const filters = {};
    if (status) filters.status = status;
    if (assigned_to) filters.assigned_to = assigned_to;
    
    const tasks = await getAllTasksModel(workspace_id, filters);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getTaskByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getTaskByIdModel(id);
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const updateTaskController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const task = await updateTaskModel(id, updateData);
    
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteTaskController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteTaskModel(id);
    
    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController
}; 