import Channel from "../models/model_database/channels.js";
import Workspace from "../models/model_database/workspaces.js";
import Notification from "../models/model_database/notifications.js";

// Get all channels with pagination
export const getAllChannels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by workspace_id if provided
    if (req.query.workspace_id) {
      query.workspace_id = req.query.workspace_id;
    }

    console.log("Query:", query);
    const channels = await Channel.find(query)
      .populate("workspace_id")
      .populate("created_by")
      .populate("members.user")
      .populate("last_message_id")
      .skip(skip)
      .limit(limit);

    const total = await Channel.countDocuments(query);
    console.log("Total channels:", channels);

    return res.status(200).json({
      success: true,
      count: channels.length,
      total,
      data: channels,
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get channel by ID
export const getChannelById = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate("workspace_id")
      .populate("created_by")
      .populate("members.user")
      .populate("last_message_id");

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error("Error fetching channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new channel
export const createChannel = async (req, res) => {
  try {
    const { name, description, workspace_id, created_by, is_private } =
      req.body;
    console.log("Request body:", req.body);

    // Verify workspace exists
    const workspace = await Workspace.findById(workspace_id);

    console.log("Workspace:", workspace);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const newChannel = new Channel({
      name,
      description,
      workspace_id,
      created_by,
      is_private,
      members: [
        {
          user: created_by,
          last_read: new Date(),
          joined_at: new Date(),
        },
      ],
    });

    const savedChannel = await newChannel.save();

    // Update workspace with new channel
    workspace.channels.push(savedChannel._id);
    await workspace.save();

    // Populate the created channel
    const populatedChannel = await Channel.findById(savedChannel._id)
      .populate("workspace_id")
      .populate("created_by")
      .populate("members.user");

    // Emit socket event for channel creation
    const io = req.app.get("io");

    // Create notifications for workspace members
    const workspaceMembers = workspace.members || [];

    // Filter out the creator as they don't need a notification about their own action
    const membersToNotify = workspaceMembers.filter(
      (member) => member.user_id.toString() !== created_by.toString()
    );

    // Create and send notifications in parallel
    const notificationPromises = membersToNotify.map(async (member) => {
      const newNotification = new Notification({
        user_id: member.user_id,
        type: "channel",
        type_id: savedChannel._id,
        workspace_id: workspace_id,
        content: `New channel "${name}" was created in workspace "${workspace.name}"`,
        related_id: created_by,
        is_read: false,
        created_at: new Date(),
      });

      await newNotification.save();
      const populatedNotification = await newNotification.populate(
        "user_id workspace_id"
      );

      // Send notification to each workspace member
      io.to(`user-${member.user_id}`).emit(
        "notification:new",
        populatedNotification
      );
    });

    await Promise.all(notificationPromises);

    // Emit to workspace room for real-time updates
    io.to(`workspace-${workspace_id}`).emit(
      "channel:created",
      populatedChannel
    );

    return res.status(201).json({
      success: true,
      data: populatedChannel,
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a channel
export const updateChannel = async (req, res) => {
  try {
    const { name, description, is_private } = req.body;
    const userId = req.user.id;
    const idChannel = req.params.id;

    const channel = await Channel.findById(idChannel);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }
    // Check if the user to be removed is the creator of the channel
    if (channel.created_by.toString() === userId) {
      return res.status(403).json({
        success: false,
        message:
          "Cannot remove the channel creator. The creator should delete the channel instead.",
      });
    }
    const updatedChannel = await Channel.findByIdAndUpdate(
      idChannel,
      {
        name,
        description,
        is_private,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("workspace_id")
      .populate("created_by")
      .populate("members.user");

    if (!updatedChannel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Emit socket event for channel update
    const io = req.app.get("io");

    // Create notifications for channel members (except the updater)
    const channelMembers = updatedChannel.members || [];

    // Filter out the user who made the update
    const membersToNotify = channelMembers.filter(
      (member) => member.user._id.toString() !== req.user.id
    );

    // Create and send notifications in parallel
    const notificationPromises = membersToNotify.map(async (member) => {
      const newNotification = new Notification({
        user_id: member.user._id,
        type: "channel_updated",
        type_id: updatedChannel._id,
        workspace_id: updatedChannel.workspace_id._id,
        content: `Channel "${updatedChannel.name}" has been updated`,
        related_id: req.user.id,
        is_read: false,
        created_at: new Date(),
      });

      await newNotification.save();
      const populatedNotification = await newNotification.populate(
        "user_id workspace_id"
      );

      // Send notification to each channel member
      io.to(`user-${member.user._id}`).emit(
        "notification:new",
        populatedNotification
      );
    });

    await Promise.all(notificationPromises);

    // Emit to channel room for real-time updates
    io.to(`channel-${updatedChannel._id}`).emit(
      "channel:updated",
      updatedChannel
    );

    // Also emit to workspace room for workspace-level updates
    io.to(`workspace-${updatedChannel.workspace_id._id}`).emit(
      "channel:updated",
      updatedChannel
    );

    return res.status(200).json({
      success: true,
      data: updatedChannel,
    });
  } catch (error) {
    console.error("Error updating channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a channel
export const deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if the user is the creator of the channel
    if (channel.created_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the channel creator can delete this channel",
      });
    }

    const workspaceId = channel.workspace_id;
    const channelId = channel._id;
    const channelName = channel.name;

    // Store members for notification before deletion
    const channelMembers = channel.members;

    // Remove channel from workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $pull: { channels: channelId },
    });

    // Delete the channel
    await Channel.findByIdAndDelete(req.params.id);

    // Create notifications for channel members (except the deleter)
    const membersToNotify = channelMembers.filter(
      (member) => member.user.toString() !== req.user.id
    );

    // Emit socket event for channel deletion
    const io = req.app.get("io");

    // Create and send notifications in parallel
    const notificationPromises = membersToNotify.map(async (member) => {
      const newNotification = new Notification({
        user_id: member.user,
        type: "channel_deleted",
        type_id: null, // Channel no longer exists
        workspace_id: workspaceId,
        content: `Channel "${channelName}" has been deleted`,
        related_id: req.user.id,
        is_read: false,
        created_at: new Date(),
      });

      await newNotification.save();
      const populatedNotification = await newNotification.populate(
        "user_id workspace_id"
      );

      // Send notification to each former channel member
      io.to(`user-${member.user}`).emit(
        "notification:new",
        populatedNotification
      );
    });

    await Promise.all(notificationPromises);

    // Emit to channel room for immediate UI updates
    io.to(`channel-${channelId}`).emit("channel:deleted", {
      channelId,
      workspaceId,
      message: `Channel "${channelName}" has been deleted`,
    });

    // Also emit to workspace room for workspace-level updates
    io.to(`workspace-${workspaceId}`).emit("channel:deleted", {
      channelId,
      workspaceId,
      message: `Channel "${channelName}" has been deleted`,
    });

    return res.status(200).json({
      success: true,
      message: "Channel deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Join a channel
export const joinChannel = async (req, res) => {
  try {
    const channelId = req.params.id;
    const userId = req.user.id; // Get the user ID from the authenticated user

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if user is already a member
    const memberExists = channel.members.some(
      (member) => member.user.toString() === userId
    );

    if (memberExists) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this channel",
      });
    }

    // Add member
    channel.members.push({
      user: userId,
      last_read: null,
      joined_at: new Date(),
    });

    await channel.save();

    // Get populated channel
    const updatedChannel = await Channel.findById(channelId)
      .populate("workspace_id")
      .populate("created_by")
      .populate("members.user");

    // Emit socket event for member addition
    const io = req.app.get("io");

    // Notify all existing members
    io.to(`channel-${channel._id}`).emit("channel:memberAdded", {
      channel: updatedChannel,
      newMember: userId,
    });

    // Create notification for channel members
    const newNotification = new Notification({
      user_id: channel.created_by,
      type: "channel_join",
      type_id: channelId,
      workspace_id: channel.workspace_id,
      content: `${req.user.name || "A user"} joined the channel "${
        channel.name
      }"`,
      related_id: userId,
      is_read: false,
      created_at: new Date(),
    });

    await newNotification.save();

    // Send notification to channel creator
    io.to(`user-${channel.created_by}`).emit(
      "notification:new",
      await newNotification.populate("user_id workspace_id")
    );

    return res.status(200).json({
      success: true,
      data: updatedChannel,
    });
  } catch (error) {
    console.error("Error joining channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Leave a channel
export const leaveChannel = async (req, res) => {
  try {
    const channelId = req.params.id;
    const userId = req.user.id;

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if user is the creator of the channel
    if (channel.created_by.toString() === userId) {
      return res.status(403).json({
        success: false,
        message:
          "The channel creator cannot leave the channel. Transfer ownership or delete the channel instead.",
      });
    }

    // Check if user is a member
    const memberIndex = channel.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this channel",
      });
    }

    // Remove member
    channel.members.splice(memberIndex, 1);
    await channel.save();

    // Get populated channel
    const updatedChannel = await Channel.findById(channelId)
      .populate("workspace_id")
      .populate("created_by")
      .populate("members.user");

    // Emit socket event for member removal
    const io = req.app.get("io");

    // Notify all remaining members
    io.to(`channel-${channel._id}`).emit("channel:memberRemoved", {
      channel: updatedChannel,
      removedMember: userId,
    });

    // Create notification
    const newNotification = new Notification({
      user_id: channel.created_by,
      type: "channel_leave",
      type_id: channelId,
      workspace_id: channel.workspace_id,
      content: `${req.user.name || "A user"} left the channel "${
        channel.name
      }"`,
      related_id: userId,
      is_read: false,
      created_at: new Date(),
    });

    await newNotification.save();

    // Send notification to channel creator
    io.to(`user-${channel.created_by}`).emit(
      "notification:new",
      await newNotification.populate("user_id workspace_id")
    );

    return res.status(200).json({
      success: true,
      message: "You have successfully left the channel",
    });
  } catch (error) {
    console.error("Error leaving channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove member from channel
export const removeMember = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if channel exists
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if the user to be removed is the creator of the channel
    if (channel.created_by.toString() === userId) {
      return res.status(403).json({
        success: false,
        message:
          "Cannot remove the channel creator. The creator should delete the channel instead.",
      });
    }

    // Check if user is a member
    const memberIndex = channel.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this channel",
      });
    }

    // Remove member
    channel.members.splice(memberIndex, 1);
    await channel.save();

    // Get populated channel
    const updatedChannel = await Channel.findById(req.params.id)
      .populate("workspace_id")
      .populate("created_by")
      .populate("members.user");

    // Emit socket event for member removal
    const io = req.app.get("io");

    // Notify all remaining members
    io.to(`channel-${channel._id}`).emit("channel:memberRemoved", {
      channel: updatedChannel,
      removedMember: userId,
    });

    // Create notification for the removed user
    const removalNotification = new Notification({
      user_id: userId,
      type: "channel_removed",
      type_id: channel._id,
      workspace_id: channel.workspace_id,
      content: `You have been removed from channel "${channel.name}"`,
      related_id: req.user.id, // The user who performed the removal
      is_read: false,
      created_at: new Date(),
    });

    await removalNotification.save();

    // Notify the removed member
    io.to(`user-${userId}`).emit(
      "notification:new",
      await removalNotification.populate("user_id workspace_id")
    );
    io.to(`user-${userId}`).emit("channel:removed", {
      channelId: channel._id,
      workspaceId: channel.workspace_id,
      message: `You have been removed from channel "${channel.name}"`,
    });

    return res.status(200).json({
      success: true,
      data: updatedChannel,
    });
  } catch (error) {
    console.error("Error removing member from channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add member to channel
export const addMember = async (req, res) => {
  try {
    const { user_id } = req.body;

    // Check if channel exists
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if user is already a member
    const memberExists = channel.members.some(
      (member) => member.user.toString() === user_id
    );

    if (memberExists) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this channel",
      });
    }

    // Add member
    channel.members.push({
      user: user_id,
      last_read: null,
      joined_at: new Date(),
    });

    await channel.save();

    // Get populated channel
    const updatedChannel = await Channel.findById(req.params.id)
      .populate("workspace_id")
      .populate("created_by")
      .populate("members.user");

    // Create notification for the added user
    const newNotification = new Notification({
      user_id: user_id,
      type: "channel_added",
      type_id: channel._id,
      workspace_id: channel.workspace_id,
      content: `You have been added to channel "${channel.name}"`,
      related_id: req.user.id, // The user who added them
      is_read: false,
      created_at: new Date(),
    });

    await newNotification.save();

    // Emit socket event for member addition
    const io = req.app.get("io");

    // Notify all existing members
    io.to(`channel-${channel._id}`).emit("channel:memberAdded", {
      channel: updatedChannel,
      newMember: user_id,
    });

    // Notify the new member
    io.to(`user-${user_id}`).emit(
      "notification:new",
      await newNotification.populate("user_id workspace_id")
    );
    io.to(`user-${user_id}`).emit("channel:joined", updatedChannel);

    return res.status(200).json({
      success: true,
      data: updatedChannel,
    });
  } catch (error) {
    console.error("Error adding member to channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
