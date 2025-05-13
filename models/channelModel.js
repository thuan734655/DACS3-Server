import Channel from "./model_database/channels.js";

const createChannelModel = async (channelData) => {
  try {
    const newChannel = new Channel(channelData);
    await newChannel.save();
    return newChannel;
  } catch (error) {
    throw new Error(`Error creating channel: ${error.message}`);
  }
};

const getAllChannelsModel = async (workspaceId, includePrivate = false) => {
  try {
    // Nếu includePrivate = false, chỉ lấy các kênh công khai
    const query = { workspace_id: workspaceId };
    if (!includePrivate) {
      query.is_private = false;
    }
    
    const channels = await Channel.find(query);
    return channels;
  } catch (error) {
    throw new Error(`Error fetching channels: ${error.message}`);
  }
};

const getChannelByIdModel = async (channelId) => {
  try {
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      throw new Error("Channel not found");
    }
    
    return channel;
  } catch (error) {
    throw new Error(`Error fetching channel: ${error.message}`);
  }
};

const updateChannelModel = async (channelId, updateData) => {
  try {
    const channel = await Channel.findByIdAndUpdate(
      channelId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!channel) {
      throw new Error("Channel not found");
    }
    
    return channel;
  } catch (error) {
    throw new Error(`Error updating channel: ${error.message}`);
  }
};

const deleteChannelModel = async (channelId) => {
  try {
    const channel = await Channel.findByIdAndDelete(channelId);
    
    if (!channel) {
      throw new Error("Channel not found");
    }
    
    return { success: true, message: "Channel deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting channel: ${error.message}`);
  }
};

const addMemberModel = async (channelId, userId) => {
  try {
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      throw new Error("Channel not found");
    }
    
    // Kiểm tra xem người dùng đã là thành viên chưa
    if (channel.members.includes(userId)) {
      throw new Error("User is already a member of this channel");
    }
    
    // Thêm thành viên mới
    channel.members.push(userId);
    
    await channel.save();
    return channel;
  } catch (error) {
    throw new Error(`Error adding member to channel: ${error.message}`);
  }
};

const removeMemberModel = async (channelId, userId) => {
  try {
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      throw new Error("Channel not found");
    }
    
    // Kiểm tra xem người dùng có phải là thành viên không
    const memberIndex = channel.members.indexOf(userId);
    
    if (memberIndex === -1) {
      throw new Error("User is not a member of this channel");
    }
    
    // Xóa thành viên
    channel.members.splice(memberIndex, 1);
    
    await channel.save();
    return channel;
  } catch (error) {
    throw new Error(`Error removing member from channel: ${error.message}`);
  }
};

export {
  createChannelModel,
  getAllChannelsModel,
  getChannelByIdModel,
  updateChannelModel,
  deleteChannelModel,
  addMemberModel,
  removeMemberModel
};
