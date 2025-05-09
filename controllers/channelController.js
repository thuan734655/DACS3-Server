import {
  createChannelModel,
  getChannelByIdModel,
  updateChannelModel,
  deleteChannelModel,
  getAllChannelsByWorkspace,
} from "../models/channelModel.js";

const createChannel = async (req, res) => {
  try {
    const data = {
      ...req.body
    };
    const newChannel = await createChannelModel(data);
    res.status(201).json({ message: "Channel created", channel: newChannel });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getChannel = async (req, res) => {
  try {
    const channel = await getChannelByIdModel(req.params.id);
    res.status(200).json(channel);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const updateChannel = async (req, res) => {
  try {
    const updated = await updateChannelModel(req.params.id, req.body);
    res.status(200).json({ message: "Channel updated", channel: updated });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const deleteChannel = async (req, res) => {
  try {
    await deleteChannelModel(req.params.id);
    res.status(200).json({ message: "Channel deleted" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const getChannelsByWorkspace = async (req, res) => {
  try {
    const channels = await getAllChannelsByWorkspace(req.params.workspaceId);
    res.status(200).json(channels);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export {
  createChannel,
  getChannel,
  updateChannel,
  deleteChannel,
  getChannelsByWorkspace,
};
