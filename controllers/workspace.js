import {
  createWorkspaceModel,
  getWorkspaceByIdModel,
  updateWorkspaceModel,
  deleteWorkspaceModel,
  getAllWorkspacesByUser,
} from "../models/workspace.js";

const createWorkspace = async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user.id,
    };
    const newWorkspace = await createWorkspaceModel(data);
    res
      .status(201)
      .json({ message: "Workspace created", workspace: newWorkspace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getWorkspace = async (req, res) => {
  try {
    const workspace = await getWorkspaceByIdModel(req.params.id);
    res.status(200).json(workspace);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const updateWorkspace = async (req, res) => {
  try {
    const workspace = await updateWorkspaceModel(req.params.id, req.body);
    res.status(200).json({ message: "Updated", workspace });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    await deleteWorkspaceModel(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const getAllUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await getAllWorkspacesByUser(req.user.id);
    res.status(200).json(workspaces);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export {
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getAllUserWorkspaces,
};
