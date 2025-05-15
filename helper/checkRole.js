import Workspace from "../models/model_database/workspaces.js";

// Helper function to check if user has permission in this workspace
export const checkWorkspacePermission = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return false;
  }

  const member = workspace.members.find(
    (member) => member.user_id.toString() === userId
  );

  if (!member) {
    return false;
  }

  // Only Leader and Manager roles can manage tasks
  return ["Leader", "Manager"].includes(member.role);
};
