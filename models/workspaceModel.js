import Workspace from "./model_database/workspaces.js";

const createWorkspaceModel = async (workspaceData) => {
  try {
    const newWorkspace = new Workspace(workspaceData);
    await newWorkspace.save();
    return newWorkspace;
  } catch (error) {
    throw new Error(`Error creating workspace: ${error.message}`);
  }
};

const getAllWorkspacesModel = async (userId) => {
  try {
    // Tìm tất cả workspaces mà người dùng là thành viên hoặc người tạo
    const workspaces = await Workspace.find({
      $or: [
        { created_by: userId },
        { "members.user_id": userId }
      ]
    }).populate("created_by", "name avatar");
    
    return workspaces;
  } catch (error) {
    throw new Error(`Error fetching workspaces: ${error.message}`);
  }
};

const getWorkspaceByIdModel = async (workspaceId) => {
  try {
    const workspace = await Workspace.findById(workspaceId)
      .populate("created_by", "name avatar")
      .populate("members.user_id", "name avatar");
    
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    return workspace;
  } catch (error) {
    throw new Error(`Error fetching workspace: ${error.message}`);
  }
};

const updateWorkspaceModel = async (workspaceId, updateData) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    return workspace;
  } catch (error) {
    throw new Error(`Error updating workspace: ${error.message}`);
  }
};

const deleteWorkspaceModel = async (workspaceId) => {
  try {
    const workspace = await Workspace.findByIdAndDelete(workspaceId);
    
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    return { success: true, message: "Workspace deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting workspace: ${error.message}`);
  }
};

const addMemberModel = async (workspaceId, userId, role = "Member") => {
  try {
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    // Kiểm tra xem người dùng đã là thành viên chưa
    const existingMember = workspace.members.find(
      member => member.user_id.toString() === userId
    );
    
    if (existingMember) {
      throw new Error("User is already a member of this workspace");
    }
    
    // Thêm thành viên mới
    workspace.members.push({
      user_id: userId,
      role
    });
    
    await workspace.save();
    return workspace;
  } catch (error) {
    throw new Error(`Error adding member: ${error.message}`);
  }
};

const removeMemberModel = async (workspaceId, userId) => {
  try {
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    // Kiểm tra xem người dùng có phải là thành viên không
    const memberIndex = workspace.members.findIndex(
      member => member.user_id.toString() === userId
    );
    
    if (memberIndex === -1) {
      throw new Error("User is not a member of this workspace");
    }
    
    // Xóa thành viên
    workspace.members.splice(memberIndex, 1);
    
    await workspace.save();
    return workspace;
  } catch (error) {
    throw new Error(`Error removing member: ${error.message}`);
  }
};

export {
  createWorkspaceModel,
  getAllWorkspacesModel,
  getWorkspaceByIdModel,
  updateWorkspaceModel,
  deleteWorkspaceModel,
  addMemberModel,
  removeMemberModel
}; 