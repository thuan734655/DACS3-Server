import ReportDaily from "./model_database/reportDaily.js";

const createReportDailyModel = async (reportData) => {
  try {
    const newReport = new ReportDaily(reportData);
    await newReport.save();
    return newReport;
  } catch (error) {
    throw new Error(`Error creating report: ${error.message}`);
  }
};

const getAllReportsDailyModel = async (workspaceId, filters = {}) => {
  try {
    const query = { workspace_id: workspaceId, ...filters };
    const reports = await ReportDaily.find(query)
      .populate("user_id", "name avatar")
      .sort({ date: -1 });
    
    return reports;
  } catch (error) {
    throw new Error(`Error fetching reports: ${error.message}`);
  }
};

const getReportDailyByIdModel = async (reportId) => {
  try {
    const report = await ReportDaily.findById(reportId)
      .populate("user_id", "name avatar");
    
    if (!report) {
      throw new Error("Report not found");
    }
    
    return report;
  } catch (error) {
    throw new Error(`Error fetching report: ${error.message}`);
  }
};

const getReportsDailyByUserModel = async (userId, filters = {}) => {
  try {
    const query = { user_id: userId, ...filters };
    const reports = await ReportDaily.find(query)
      .sort({ date: -1 });
    
    return reports;
  } catch (error) {
    throw new Error(`Error fetching reports: ${error.message}`);
  }
};

const getReportsDailyByDateModel = async (workspaceId, date) => {
  try {
    // Lấy các báo cáo theo ngày
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const reports = await ReportDaily.find({
      workspace_id: workspaceId,
      date: { $gte: startDate, $lte: endDate }
    }).populate("user_id", "name avatar");
    
    return reports;
  } catch (error) {
    throw new Error(`Error fetching reports by date: ${error.message}`);
  }
};

const updateReportDailyModel = async (reportId, updateData) => {
  try {
    const report = await ReportDaily.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true, runValidators: true }
    ).populate("user_id", "name avatar");
    
    if (!report) {
      throw new Error("Report not found");
    }
    
    return report;
  } catch (error) {
    throw new Error(`Error updating report: ${error.message}`);
  }
};

const deleteReportDailyModel = async (reportId) => {
  try {
    const report = await ReportDaily.findByIdAndDelete(reportId);
    
    if (!report) {
      throw new Error("Report not found");
    }
    
    return { success: true, message: "Report deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting report: ${error.message}`);
  }
};

export {
  createReportDailyModel,
  getAllReportsDailyModel,
  getReportDailyByIdModel,
  getReportsDailyByUserModel,
  getReportsDailyByDateModel,
  updateReportDailyModel,
  deleteReportDailyModel
}; 