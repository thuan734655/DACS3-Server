import {
  createReportDailyModel,
  getAllReportsDailyModel,
  getReportDailyByIdModel,
  getReportsDailyByUserModel,
  getReportsDailyByDateModel,
  updateReportDailyModel,
  deleteReportDailyModel
} from "../models/reportDailyModel.js";

const createReportDailyController = async (req, res) => {
  try {
    const { 
      workspace_id, 
      content, 
      inprogress,
      completed,
      date
    } = req.body;
    
    const user_id = req.user.id; // Assuming user ID is available from auth middleware
    
    // Nếu không có date thì mặc định là ngày hôm nay
    const reportDate = date ? new Date(date) : new Date();
    
    const reportData = {
      user_id,
      workspace_id,
      content,
      inprogress: inprogress || [],
      completed: completed || [],
      date: reportDate
    };
    
    const report = await createReportDailyModel(reportData);
    
    res.status(201).json({
      success: true,
      message: "Daily report created successfully",
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllReportsDailyController = async (req, res) => {
  try {
    const { workspace_id } = req.params;
    const { user_id, startDate, endDate } = req.query;
    
    // Build filters based on query parameters
    const filters = {};
    if (user_id) filters.user_id = user_id;
    
    if (startDate && endDate) {
      filters.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filters.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filters.date = { $lte: new Date(endDate) };
    }
    
    const reports = await getAllReportsDailyModel(workspace_id, filters);
    
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getReportDailyByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await getReportDailyByIdModel(id);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const getMyReportsDailyController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspace_id, startDate, endDate } = req.query;
    
    // Build filters based on query parameters
    const filters = {};
    if (workspace_id) filters.workspace_id = workspace_id;
    
    if (startDate && endDate) {
      filters.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filters.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filters.date = { $lte: new Date(endDate) };
    }
    
    const reports = await getReportsDailyByUserModel(userId, filters);
    
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getReportsDailyByDateController = async (req, res) => {
  try {
    const { workspace_id, date } = req.params;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required"
      });
    }
    
    const reports = await getReportsDailyByDateModel(workspace_id, date);
    
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateReportDailyController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Kiểm tra xem người dùng có quyền cập nhật báo cáo không
    const report = await getReportDailyByIdModel(id);
    
    if (report.user_id._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this report"
      });
    }
    
    const updatedReport = await updateReportDailyModel(id, updateData);
    
    res.status(200).json({
      success: true,
      message: "Daily report updated successfully",
      data: updatedReport
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteReportDailyController = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem người dùng có quyền xóa báo cáo không
    const report = await getReportDailyByIdModel(id);
    
    if (report.user_id._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this report"
      });
    }
    
    await deleteReportDailyModel(id);
    
    res.status(200).json({
      success: true,
      message: "Daily report deleted successfully"
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createReportDailyController,
  getAllReportsDailyController,
  getReportDailyByIdController,
  getMyReportsDailyController,
  getReportsDailyByDateController,
  updateReportDailyController,
  deleteReportDailyController
}; 