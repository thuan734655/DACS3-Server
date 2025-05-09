import Kanban from "./model_database/kanban.js";
import Workspace from "./model_database/workspaces.js";
import Task from "./model_database/tasks.js";

const createKanbanModel = async (workspace_id, name, user_id) => {
  const workspace = await Workspace.findById(workspace_id);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const member = workspace.members.find(
    (m) => m.user_id.toString() === user_id.toString()
  );
  if (!member || member.role !== "Leader") {
    throw new Error(
      "Permission denied: Only Leader or Manager can create Kanban"
    );
  }

  const newKanban = new Kanban({
    workspace_id,
    name,
    columns: [
      { name: "To Do", task_ids: [] },
      { name: "In Progress", task_ids: [] },
      { name: "Done", task_ids: [] },
    ],
  });

  await newKanban.save();
  return newKanban;
};

const getKanbansByWorkspaceModel = async (workspace_id, user_id) => {
  const workspace = await Workspace.findById(workspace_id);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const isMember = workspace.members.some(
    (m) => m.user_id.toString() === user_id.toString()
  );
  if (!isMember) {
    throw new Error(
      "Permission denied: User is not a member of this workspace"
    );
  }

  const kanbans = await Kanban.find({ workspace_id }).select("name created_at");
  return kanbans;
};

const getKanbanByIdModel = async (kanban_id, user_id) => {
  const kanban = await Kanban.findById(kanban_id).populate("columns.task_ids");
  if (!kanban) {
    throw new Error("Kanban not found");
  }

  const workspace = await Workspace.findById(kanban.workspace_id);
  const isMember = workspace.members.some(
    (m) => m.user_id.toString() === user_id.toString()
  );
  if (!isMember) {
    throw new Error(
      "Permission denied: User is not a member of this workspace"
    );
  }

  return kanban;
};

const updateKanbanModel = async (kanban_id, updates, user_id) => {
  const kanban = await Kanban.findById(kanban_id);
  if (!kanban) {
    throw new Error("Kanban not found");
  }

  const workspace = await Workspace.findById(kanban.workspace_id);
  const member = workspace.members.find(
    (m) => m.user_id.toString() === user_id.toString()
  );
  if (!member || !["Leader", "Manager"].includes(member.role)) {
    throw new Error(
      "Permission denied: Only Leader or Manager can update Kanban"
    );
  }

  if (updates.name) {
    kanban.name = updates.name;
  }

  if (updates.sourceColumn && updates.destColumn && updates.task_id) {
    const task = await Task.findById(updates.task_id);
    if (!task) {
      throw new Error("Task not found");
    }

    const sourceColumn = kanban.columns.find(
      (col) => col.name === updates.sourceColumn
    );
    if (!sourceColumn) {
      throw new Error("Source column not found");
    }
    sourceColumn.task_ids = sourceColumn.task_ids.filter(
      (id) => id.toString() !== updates.task_id.toString()
    );

    const destColumn = kanban.columns.find(
      (col) => col.name === updates.destColumn
    );
    if (!destColumn) {
      throw new Error("Destination column not found");
    }
    destColumn.task_ids.push(updates.task_id);

    if (updates.destColumn === "Done") {
      await Task.updateOne({ _id: updates.task_id }, { status: "Done" });
    } else if (updates.destColumn === "In Progress") {
      await Task.updateOne({ _id: updates.task_id }, { status: "In Progress" });
    } else if (updates.destColumn === "To Do") {
      await Task.updateOne({ _id: updates.task_id }, { status: "To Do" });
    }
  }

  await kanban.save();
  return kanban;
};

const deleteKanbanModel = async (kanban_id, user_id) => {
  const kanban = await Kanban.findById(kanban_id);
  if (!kanban) {
    throw new Error("Kanban not found");
  }

  const workspace = await Workspace.findById(kanban.workspace_id);
  const member = workspace.members.find(
    (m) => m.user_id.toString() === user_id.toString()
  );
  if (!member || !["Leader", "Manager"].includes(member.role)) {
    throw new Error(
      "Permission denied: Only Leader or Manager can delete Kanban"
    );
  }

  await kanban.deleteOne();
  return { message: "Kanban deleted successfully" };
};

export {
  createKanbanModel,
  getKanbansByWorkspaceModel,
  getKanbanByIdModel,
  updateKanbanModel,
  deleteKanbanModel,
};
