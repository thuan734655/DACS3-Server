import {
  createWorkspaceModel,
  getAllWorkspacesModel,
  getWorkspaceByIdModel,
  updateWorkspaceModel,
  deleteWorkspaceModel,
  addMemberModel,
  removeMemberModel
} from "../models/workspaceModel.js";

const createWorkspaceController = async (req, res) => {
  try {
    const { name, description } = req.body;
    const created_by = req.user.id; // Assuming user ID is available from auth middleware
    
    // Tạo workspace với người dùng hiện tại là người tạo và thành viên
    const workspaceData = {
      name,
      description,
      created_by,
      members: [
        {
          user_id: created_by,
          role: "Leader"
        }
      ]
    };
    
    const workspace = await createWorkspaceModel(workspaceData);
    
    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllWorkspacesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const workspaces = await getAllWorkspacesModel(userId);
    
    res.status(200).json({
      success: true,
      count: workspaces.length,
      data: workspaces
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getWorkspaceByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await getWorkspaceByIdModel(id);
    
    res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const updateWorkspaceController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Kiểm tra xem người dùng có quyền cập nhật workspace không
    const workspace = await getWorkspaceByIdModel(id);
    
    if (workspace.created_by._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this workspace"
      });
    }
    
    const updatedWorkspace = await updateWorkspaceModel(id, updateData);
    
    res.status(200).json({
      success: true,
      message: "Workspace updated successfully",
      data: updatedWorkspace
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteWorkspaceController = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem người dùng có quyền xóa workspace không
    const workspace = await getWorkspaceByIdModel(id);
    
    if (workspace.created_by._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this workspace"
      });
    }
    
    await deleteWorkspaceModel(id);
    
    res.status(200).json({
      success: true,
      message: "Workspace deleted successfully"
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const addMemberController = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    
    const workspace = await addMemberModel(id, userId, role);
    
    res.status(200).json({
      success: true,
      message: "Member added successfully",
      data: workspace
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const removeMemberController = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    const workspace = await removeMemberModel(id, userId);
    
    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: workspace
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createWorkspaceController,
  getAllWorkspacesController,
  getWorkspaceByIdController,
  updateWorkspaceController,
  deleteWorkspaceController,
  addMemberController,
  removeMemberController
}; 