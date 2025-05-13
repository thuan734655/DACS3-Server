import Task from "./model_database/tasks.js";

const createTaskModel = async (taskData) => {
  try {
    const newTask = new Task(taskData);
    await newTask.save();
    return newTask;
  } catch (error) {
    throw new Error(`Error creating task: ${error.message}`);
  }
};

const getAllTasksModel = async (workspaceId, filters = {}) => {
  try {
    const query = { workspace_id: workspaceId, ...filters };
    const tasks = await Task.find(query)
      .populate("assigned_to", "name avatar")
      .populate("created_by", "name avatar");
    return tasks;
  } catch (error) {
    throw new Error(`Error fetching tasks: ${error.message}`);
  }
};

const getTaskByIdModel = async (taskId) => {
  try {
    const task = await Task.findById(taskId)
      .populate("assigned_to", "name avatar")
      .populate("created_by", "name avatar");
    
    if (!task) {
      throw new Error("Task not found");
    }
    
    return task;
  } catch (error) {
    throw new Error(`Error fetching task: ${error.message}`);
  }
};

const updateTaskModel = async (taskId, updateData) => {
  try {
    const task = await Task.findByIdAndUpdate(
      taskId,
      { ...updateData, updated_at: Date.now() },
      { new: true, runValidators: true }
    ).populate("assigned_to", "name avatar");
    
    if (!task) {
      throw new Error("Task not found");
    }
    
    return task;
  } catch (error) {
    throw new Error(`Error updating task: ${error.message}`);
  }
};

const deleteTaskModel = async (taskId) => {
  try {
    const task = await Task.findByIdAndDelete(taskId);
    
    if (!task) {
      throw new Error("Task not found");
    }
    
    return { success: true, message: "Task deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting task: ${error.message}`);
  }
};

export {
  createTaskModel,
  getAllTasksModel,
  getTaskByIdModel,
  updateTaskModel,
  deleteTaskModel
}; 