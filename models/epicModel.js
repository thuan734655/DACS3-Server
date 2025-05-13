import Epic from "./model_database/epics.js";

const createEpicModel = async (epicData) => {
  try {
    const newEpic = new Epic(epicData);
    await newEpic.save();
    return newEpic;
  } catch (error) {
    throw new Error(`Error creating epic: ${error.message}`);
  }
};

const getAllEpicsModel = async (workspaceId, filters = {}) => {
  try {
    const query = { workspace_id: workspaceId, ...filters };
    const epics = await Epic.find(query);
    return epics;
  } catch (error) {
    throw new Error(`Error fetching epics: ${error.message}`);
  }
};

const getEpicByIdModel = async (epicId) => {
  try {
    const epic = await Epic.findById(epicId);
    
    if (!epic) {
      throw new Error("Epic not found");
    }
    
    return epic;
  } catch (error) {
    throw new Error(`Error fetching epic: ${error.message}`);
  }
};

const updateEpicModel = async (epicId, updateData) => {
  try {
    const epic = await Epic.findByIdAndUpdate(
      epicId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!epic) {
      throw new Error("Epic not found");
    }
    
    return epic;
  } catch (error) {
    throw new Error(`Error updating epic: ${error.message}`);
  }
};

const deleteEpicModel = async (epicId) => {
  try {
    const epic = await Epic.findByIdAndDelete(epicId);
    
    if (!epic) {
      throw new Error("Epic not found");
    }
    
    return { success: true, message: "Epic deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting epic: ${error.message}`);
  }
};

export {
  createEpicModel,
  getAllEpicsModel,
  getEpicByIdModel,
  updateEpicModel,
  deleteEpicModel
}; 