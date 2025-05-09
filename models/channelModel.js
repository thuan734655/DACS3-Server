import Channel from "./model_database/channels.js";

const createChannelModel = async (data) => {
  const newChannel = new Channel(data);
  await newChannel.save();
  return newChannel;
};

const getChannelByIdModel = async (channelId) => {
  const channel = await Channel.findById(channelId)
    .populate("created_by", "username email")
    .populate("members", "username email")
    .populate("workspace_id", "name");
  if (!channel) throw new Error("Channel not found");
  return channel;
};

const updateChannelModel = async (channelId, updateData) => {
  const channel = await Channel.findByIdAndUpdate(channelId, updateData, {
    new: true,
  });
  if (!channel) throw new Error("Channel not found");
  return channel;
};

const deleteChannelModel = async (channelId) => {
  const channel = await Channel.findByIdAndDelete(channelId);
  if (!channel) throw new Error("Channel not found or already deleted");
  return channel;
};

const getAllChannelsByWorkspace = async (workspaceId) => {
  const channels = await Channel.find({ workspace_id: workspaceId });
  return channels;
};

export {
  createChannelModel,
  getChannelByIdModel,
  updateChannelModel,
  deleteChannelModel,
  getAllChannelsByWorkspace,
};
