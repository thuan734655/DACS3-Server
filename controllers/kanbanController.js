import {
  createKanbanModel,
  getKanbansByWorkspaceModel,
  getKanbanByIdModel,
  updateKanbanModel,
  deleteKanbanModel,
} from "../models/kanbanModel.js";
import dotenv from "dotenv";

dotenv.config();

const createKanbanController = async (req, res) => {
  const { workspace_id, name } = req.body;
  const user_id = req.user.id;

  try {
    const newKanban = await createKanbanModel(workspace_id, name, user_id);
    res.status(201).json({
      message: "Kanban created successfully",
      success: true,
      kanban: {
        _id: newKanban._id,
        workspace_id: newKanban.workspace_id,
        name: newKanban.name,
        columns: newKanban.columns,
        created_at: newKanban.created_at,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

const getKanbansByWorkspaceController = async (req, res) => {
  const { workspace_id } = req.params;
  const user_id = req.user.id;

  try {
    const kanbans = await getKanbansByWorkspaceModel(workspace_id, user_id);
    res.status(200).json({
      message: "Kanbans retrieved successfully",
      success: true,
      kanbans,
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

const getKanbanByIdController = async (req, res) => {
  const { kanban_id } = req.params;
  const user_id = req.user.id;

  try {
    const kanban = await getKanbanByIdModel(kanban_id, user_id);
    res.status(200).json({
      message: "Kanban retrieved successfully",
      success: true,
      kanban,
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

const updateKanbanController = async (req, res) => {
  const { kanban_id } = req.params;
  const { name, sourceColumn, destColumn, task_id } = req.body;
  const user_id = req.user.id;

  try {
    const updates = { name, sourceColumn, destColumn, task_id };
    const updatedKanban = await updateKanbanModel(kanban_id, updates, user_id);
    res.status(200).json({
      message: "Kanban updated successfully",
      success: true,
      kanban: updatedKanban,
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

const deleteKanbanController = async (req, res) => {
  const { kanban_id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await deleteKanbanModel(kanban_id, user_id);
    res.status(200).json({
      message: result.message,
      success: true,
    });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

export {
  createKanbanController,
  getKanbansByWorkspaceController,
  getKanbanByIdController,
  updateKanbanController,
  deleteKanbanController,
};