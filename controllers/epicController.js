import {
  createEpicModel,
  getAllEpicsModel,
  getEpicByIdModel,
  updateEpicModel,
  deleteEpicModel
} from "../models/epicModel.js";

const createEpicController = async (req, res) => {
  try {
    const { 
      workspace_id, 
      name, 
      description, 
      start_date, 
      end_date, 
      status 
    } = req.body;
    
    const created_by = req.user.id; 
    
    const epicData = {
      workspace_id,
      name,
      description,
      created_by,
      start_date,
      end_date,
      status: status || "To Do"
    };
    
    const epic = await createEpicModel(epicData);
    
    res.status(201).json({
      success: true,
      message: "Epic created successfully",
      data: epic
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllEpicsController = async (req, res) => {
  try {
    const { workspace_id } = req.params;
    const { status } = req.query;
    
    // Build filters based on query parameters
    const filters = {};
    if (status) filters.status = status;
    
    const epics = await getAllEpicsModel(workspace_id, filters);
    
    res.status(200).json({
      success: true,
      count: epics.length,
      data: epics
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getEpicByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const epic = await getEpicByIdModel(id);
    
    res.status(200).json({
      success: true,
      data: epic
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const updateEpicController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Nếu cập nhật tiến độ, cũng cập nhật trạng thái
    if (updateData.progress !== undefined) {
      const progress = updateData.progress;
      if (progress === 100) {
        updateData.status = "Done";
      } else if (progress > 0) {
        updateData.status = "In Progress";
      }
    }
    
    const epic = await updateEpicModel(id, updateData);
    
    res.status(200).json({
      success: true,
      message: "Epic updated successfully",
      data: epic
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteEpicController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteEpicModel(id);
    
    res.status(200).json({
      success: true,
      message: "Epic deleted successfully"
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createEpicController,
  getAllEpicsController,
  getEpicByIdController,
  updateEpicController,
  deleteEpicController
};