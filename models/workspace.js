import Workspace from "./model_database/workspaces.js";

const createWorkspaceModel = async (data) => {
  const newWorkspace = new Workspace(data);
  await newWorkspace.save();
  return newWorkspace;
};

const getWorkspaceByIdModel = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId)
    .populate("created_by", "username email")
    .populate("members.user_id", "username email");
  if (!workspace) throw new Error("Workspace not found");
  return workspace;
};

const updateWorkspaceModel = async (workspaceId, updateData) => {
  const workspace = await Workspace.findByIdAndUpdate(workspaceId, updateData, {
    new: true,
  });
  if (!workspace) throw new Error("Workspace not found");
  return workspace;
};

const deleteWorkspaceModel = async (workspaceId) => {
  const workspace = await Workspace.findByIdAndDelete(workspaceId);
  if (!workspace) throw new Error("Workspace not found or already deleted");
  return workspace;
};

const getAllWorkspacesByUser = async (userId) => {
  const workspaces = await Workspace.find({
    $or: [{ created_by: userId }, { "members.user_id": userId }],
  });
  return workspaces;
};

export {
  createWorkspaceModel,
  getWorkspaceByIdModel,
  updateWorkspaceModel,
  deleteWorkspaceModel,
  getAllWorkspacesByUser,
};
