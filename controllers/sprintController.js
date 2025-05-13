import {
  createSprintModel,
  getAllSprintsModel,
  getSprintByIdModel,
  updateSprintModel,
  deleteSprintModel,
  addTaskToSprintModel,
  removeTaskFromSprintModel,
  updateTaskStatusInSprintModel
} from "../models/sprintModel.js";

const createSprintController = async (req, res) => {
  try {
    const { 
      workspace_is, 
      name, 
      description, 
      goal,
      start_date, 
      end_date
    } = req.body;
    
    const create_by = req.user.id; // Assuming user ID is available from auth middleware
    
    // Kiểm tra ngày bắt đầu và kết thúc
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }
    
    const sprintData = {
      workspace_is,
      create_by,
      name,
      description,
      goal,
      start_date,
      end_date,
      task: [],
      status: "To Do",
      progress: 0
    };
    
    const sprint = await createSprintModel(sprintData);
    
    res.status(201).json({
      success: true,
      message: "Sprint created successfully",
      data: sprint
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllSprintsController = async (req, res) => {
  try {
    const { workspace_id } = req.params;
    const { status } = req.query;
    
    // Build filters based on query parameters
    const filters = {};
    if (status) filters.status = status;
    
    const sprints = await getAllSprintsModel(workspace_id, filters);
    
    res.status(200).json({
      success: true,
      count: sprints.length,
      data: sprints
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getSprintByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const sprint = await getSprintByIdModel(id);
    
    res.status(200).json({
      success: true,
      data: sprint
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const updateSprintController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Nếu có cập nhật ngày, kiểm tra tính hợp lệ
    if (updateData.start_date && updateData.end_date) {
      if (new Date(updateData.start_date) >= new Date(updateData.end_date)) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date"
        });
      }
    } else if (updateData.start_date) {
      const sprint = await getSprintByIdModel(id);
      if (new Date(updateData.start_date) >= new Date(sprint.end_date)) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date"
        });
      }
    } else if (updateData.end_date) {
      const sprint = await getSprintByIdModel(id);
      if (new Date(sprint.start_date) >= new Date(updateData.end_date)) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date"
        });
      }
    }
    
    const sprint = await updateSprintModel(id, updateData);
    
    res.status(200).json({
      success: true,
      message: "Sprint updated successfully",
      data: sprint
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteSprintController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteSprintModel(id);
    
    res.status(200).json({
      success: true,
      message: "Sprint deleted successfully"
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const addTaskToSprintController = async (req, res) => {
  try {
    const { id } = req.params;
    const { task_id, status } = req.body;
    
    const taskData = {
      task_id,
      status: status || "To Do"
    };
    
    const sprint = await addTaskToSprintModel(id, taskData);
    
    res.status(200).json({
      success: true,
      message: "Task added to sprint successfully",
      data: sprint
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const removeTaskFromSprintController = async (req, res) => {
  try {
    const { id, task_id } = req.params;
    
    const sprint = await removeTaskFromSprintModel(id, task_id);
    
    res.status(200).json({
      success: true,
      message: "Task removed from sprint successfully",
      data: sprint
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const updateTaskStatusInSprintController = async (req, res) => {
  try {
    const { id, task_id } = req.params;
    const { status } = req.body;
    
    if (!["To Do", "In Progress", "Done"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: To Do, In Progress, Done"
      });
    }
    
    const sprint = await updateTaskStatusInSprintModel(id, task_id, status);
    
    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: sprint
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createSprintController,
  getAllSprintsController,
  getSprintByIdController,
  updateSprintController,
  deleteSprintController,
  addTaskToSprintController,
  removeTaskFromSprintController,
  updateTaskStatusInSprintController
}; 