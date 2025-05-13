import Sprint from "./model_database/sprints.js";

const createSprintModel = async (sprintData) => {
  try {
    const newSprint = new Sprint(sprintData);
    await newSprint.save();
    return newSprint;
  } catch (error) {
    throw new Error(`Error creating sprint: ${error.message}`);
  }
};

const getAllSprintsModel = async (workspaceId, filters = {}) => {
  try {
    const query = { workspace_is: workspaceId, ...filters };
    const sprints = await Sprint.find(query)
      .populate("create_by", "name avatar")
      .populate("task.task_id");
    
    return sprints;
  } catch (error) {
    throw new Error(`Error fetching sprints: ${error.message}`);
  }
};

const getSprintByIdModel = async (sprintId) => {
  try {
    const sprint = await Sprint.findById(sprintId)
      .populate("create_by", "name avatar")
      .populate("task.task_id");
    
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    
    return sprint;
  } catch (error) {
    throw new Error(`Error fetching sprint: ${error.message}`);
  }
};

const updateSprintModel = async (sprintId, updateData) => {
  try {
    // Nếu đang cập nhật các task, tính toán lại tiến độ
    if (updateData.task) {
      const totalTasks = updateData.task.length;
      let completedTasks = 0;
      
      updateData.task.forEach(task => {
        if (task.status === "Done") {
          completedTasks++;
        }
      });
      
      if (totalTasks > 0) {
        updateData.progress = Math.round((completedTasks / totalTasks) * 100);
        
        // Cập nhật trạng thái dựa trên tiến độ
        if (updateData.progress === 100) {
          updateData.status = "Done";
        } else if (updateData.progress > 0) {
          updateData.status = "In Progress";
        } else {
          updateData.status = "To Do";
        }
      }
    }
    
    const sprint = await Sprint.findByIdAndUpdate(
      sprintId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate("create_by", "name avatar")
    .populate("task.task_id");
    
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    
    return sprint;
  } catch (error) {
    throw new Error(`Error updating sprint: ${error.message}`);
  }
};

const deleteSprintModel = async (sprintId) => {
  try {
    const sprint = await Sprint.findByIdAndDelete(sprintId);
    
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    
    return { success: true, message: "Sprint deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting sprint: ${error.message}`);
  }
};

const addTaskToSprintModel = async (sprintId, taskData) => {
  try {
    const sprint = await Sprint.findById(sprintId);
    
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    
    // Kiểm tra xem task đã tồn tại trong sprint chưa
    const existingTask = sprint.task.find(
      t => t.task_id.toString() === taskData.task_id
    );
    
    if (existingTask) {
      throw new Error("Task already exists in this sprint");
    }
    
    // Thêm task mới
    sprint.task.push({
      task_id: taskData.task_id,
      status: taskData.status || "To Do"
    });
    
    // Cập nhật tiến độ
    const totalTasks = sprint.task.length;
    let completedTasks = 0;
    
    sprint.task.forEach(task => {
      if (task.status === "Done") {
        completedTasks++;
      }
    });
    
    if (totalTasks > 0) {
      sprint.progress = Math.round((completedTasks / totalTasks) * 100);
      
      // Cập nhật trạng thái dựa trên tiến độ
      if (sprint.progress === 100) {
        sprint.status = "Done";
      } else if (sprint.progress > 0) {
        sprint.status = "In Progress";
      } else {
        sprint.status = "To Do";
      }
    }
    
    await sprint.save();
    
    return sprint;
  } catch (error) {
    throw new Error(`Error adding task to sprint: ${error.message}`);
  }
};

const removeTaskFromSprintModel = async (sprintId, taskId) => {
  try {
    const sprint = await Sprint.findById(sprintId);
    
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    
    // Tìm vị trí của task trong mảng
    const taskIndex = sprint.task.findIndex(
      t => t.task_id.toString() === taskId
    );
    
    if (taskIndex === -1) {
      throw new Error("Task not found in this sprint");
    }
    
    // Xóa task
    sprint.task.splice(taskIndex, 1);
    
    // Cập nhật tiến độ
    const totalTasks = sprint.task.length;
    let completedTasks = 0;
    
    sprint.task.forEach(task => {
      if (task.status === "Done") {
        completedTasks++;
      }
    });
    
    if (totalTasks > 0) {
      sprint.progress = Math.round((completedTasks / totalTasks) * 100);
      
      // Cập nhật trạng thái dựa trên tiến độ
      if (sprint.progress === 100) {
        sprint.status = "Done";
      } else if (sprint.progress > 0) {
        sprint.status = "In Progress";
      } else {
        sprint.status = "To Do";
      }
    } else {
      sprint.progress = 0;
      sprint.status = "To Do";
    }
    
    await sprint.save();
    
    return sprint;
  } catch (error) {
    throw new Error(`Error removing task from sprint: ${error.message}`);
  }
};

const updateTaskStatusInSprintModel = async (sprintId, taskId, status) => {
  try {
    const sprint = await Sprint.findById(sprintId);
    
    if (!sprint) {
      throw new Error("Sprint not found");
    }
    
    // Tìm task trong sprint
    const task = sprint.task.find(
      t => t.task_id.toString() === taskId
    );
    
    if (!task) {
      throw new Error("Task not found in this sprint");
    }
    
    // Cập nhật trạng thái
    task.status = status;
    
    // Cập nhật tiến độ
    const totalTasks = sprint.task.length;
    let completedTasks = 0;
    
    sprint.task.forEach(task => {
      if (task.status === "Done") {
        completedTasks++;
      }
    });
    
    if (totalTasks > 0) {
      sprint.progress = Math.round((completedTasks / totalTasks) * 100);
      
      // Cập nhật trạng thái dựa trên tiến độ
      if (sprint.progress === 100) {
        sprint.status = "Done";
      } else if (sprint.progress > 0) {
        sprint.status = "In Progress";
      } else {
        sprint.status = "To Do";
      }
    }
    
    await sprint.save();
    
    return sprint;
  } catch (error) {
    throw new Error(`Error updating task status in sprint: ${error.message}`);
  }
};

export {
  createSprintModel,
  getAllSprintsModel,
  getSprintByIdModel,
  updateSprintModel,
  deleteSprintModel,
  addTaskToSprintModel,
  removeTaskFromSprintModel,
  updateTaskStatusInSprintModel
}; 