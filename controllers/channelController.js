import {
  createChannelModel,
  getAllChannelsModel,
  getChannelByIdModel,
  updateChannelModel,
  deleteChannelModel,
  addMemberModel,
  removeMemberModel
} from "../models/channelModel.js";

const createChannelController = async (req, res) => {
  try {
    const { workspace_id, name, description, is_private } = req.body;
    const created_by = req.user.id; // Assuming user ID is available from auth middleware
    
    const channelData = {
      workspace_id,
      name,
      description,
      created_by,
      is_private: is_private || false,
      members: [created_by] // Creator is automatically a member
    };
    
    const channel = await createChannelModel(channelData);
    
    res.status(201).json({
      success: true,
      message: "Channel created successfully",
      data: channel
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAllChannelsController = async (req, res) => {
  try {
    const { workspace_id } = req.params;
    const { include_private } = req.query;
    
    // Nếu include_private=true, lấy cả kênh riêng tư
    const includePrivate = include_private === 'true';
    
    const channels = await getAllChannelsModel(workspace_id, includePrivate);
    
    res.status(200).json({
      success: true,
      count: channels.length,
      data: channels
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getChannelByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await getChannelByIdModel(id);
    
    // Kiểm tra quyền truy cập
    if (channel.is_private && !channel.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this channel"
      });
    }
    
    res.status(200).json({
      success: true,
      data: channel
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const updateChannelController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Kiểm tra quyền cập nhật (chỉ người tạo mới có quyền)
    const channel = await getChannelByIdModel(id);
    
    if (channel.created_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this channel"
      });
    }
    
    const updatedChannel = await updateChannelModel(id, updateData);
    
    res.status(200).json({
      success: true,
      message: "Channel updated successfully",
      data: updatedChannel
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteChannelController = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra quyền xóa (chỉ người tạo mới có quyền)
    const channel = await getChannelByIdModel(id);
    
    if (channel.created_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this channel"
      });
    }
    
    await deleteChannelModel(id);
    
    res.status(200).json({
      success: true,
      message: "Channel deleted successfully"
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
    const { userId } = req.body;
    
    // Kiểm tra quyền (chỉ người tạo hoặc thành viên mới có thể thêm người khác)
    const channel = await getChannelByIdModel(id);
    
    if (channel.created_by.toString() !== req.user.id && !channel.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add members to this channel"
      });
    }
    
    const updatedChannel = await addMemberModel(id, userId);
    
    res.status(200).json({
      success: true,
      message: "Member added to channel successfully",
      data: updatedChannel
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
    
    // Kiểm tra quyền (chỉ người tạo hoặc thành viên tự rời đi)
    const channel = await getChannelByIdModel(id);
    
    if (channel.created_by.toString() !== req.user.id && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to remove members from this channel"
      });
    }
    
    // Không cho phép xóa người tạo
    if (userId === channel.created_by.toString()) {
      return res.status(400).json({
        success: false,
        message: "Channel creator cannot be removed from the channel"
      });
    }
    
    const updatedChannel = await removeMemberModel(id, userId);
    
    res.status(200).json({
      success: true,
      message: "Member removed from channel successfully",
      data: updatedChannel
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createChannelController,
  getAllChannelsController,
  getChannelByIdController,
  updateChannelController,
  deleteChannelController,
  addMemberController,
  removeMemberController
};
