import Message from "../models/model_database/messages.js";
import Channel from "../models/model_database/channels.js";
import User from "../models/model_database/users.js";
import Notification from "../models/model_database/notifications.js";

// Get all messages for a channel with pagination
export const getChannelMessages = async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Validate that the channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }
    
    // Check if user is a member of the channel
    const userId = req.user.id;
    const isMember = channel.members.some(member => member.user.toString() === userId);
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of the channel to view messages"
      });
    }
    
    // Query channel messages
    const query = {
      type_message: "channel",
      channel_id: channelId,
      // Only get top-level messages (not thread replies)
      thread_parent_id: null
    };
    
    const messages = await Message.find(query)
      .sort({ created_at: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .populate("sender_id");
    
    // Reverse to get oldest messages first (better for chat UI)
    messages.reverse();
    
    const total = await Message.countDocuments(query);
    
    // Update user's last_read timestamp in the channel
    const memberIndex = channel.members.findIndex(
      member => member.user.toString() === userId
    );
    
    if (memberIndex !== -1) {
      channel.members[memberIndex].last_read = new Date();
      await channel.save();
    }
    
    return res.status(200).json({
      success: true,
      count: messages.length,
      total,
      data: messages
    });
  } catch (error) {
    console.error("Error fetching channel messages:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send a message to a channel
export const sendChannelMessage = async (req, res) => {
  try {
    const { content, type, file_url, thread_parent_id } = req.body;
    const senderId = req.user.id;
    const channelId = req.params.channelId;
    
    // Validate that the channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }
    
    // Check if user is a member of the channel
    const isMember = channel.members.some(member => member.user.toString() === senderId);
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of the channel to send messages"
      });
    }
    
    const newMessage = new Message({
      type_message: "channel",
      channel_id: channelId,
      sender_id: senderId,
      content,
      type: type || "text",
      file_url,
      thread_parent_id,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const savedMessage = await newMessage.save();
    
    // Populate the message
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender_id")
      .populate("channel_id");
    
    // Update the channel's last message info
    await Channel.findByIdAndUpdate(channelId, {
      last_message_id: savedMessage._id,
      last_message_preview: content ? 
        (content.length > 50 ? content.substring(0, 50) + "..." : content) : 
        (type === "image" ? "Shared an image" : "New message"),
      last_message_at: new Date()
    });
    
    // Emit socket event for new message
    const io = req.app.get('io');
    
    // Emit to channel room
    io.to(`channel-${channelId}`).emit('message:created', populatedMessage);
    
    // If it's a thread reply, also notify the thread participants
    if (thread_parent_id) {
      io.to(`thread-${thread_parent_id}`).emit('thread:reply', populatedMessage);
    }
    
    return res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error("Error sending channel message:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reply to a thread in a channel
export const replyToChannelThread = async (req, res) => {
  try {
    const { content, type, file_url } = req.body;
    const senderId = req.user.id;
    const messageId = req.params.messageId;
    
    // Validate parent message exists and is a channel message
    const parentMessage = await Message.findById(messageId);
    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: "Parent message not found"
      });
    }
    
    if (parentMessage.type_message !== "channel") {
      return res.status(400).json({
        success: false,
        message: "Parent message is not a channel message"
      });
    }
    
    // Get the channel ID from the parent message
    const channelId = parentMessage.channel_id;
    
    // Check if user is a member of the channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }
    
    const isMember = channel.members.some(member => member.user.toString() === senderId);
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of the channel to reply to messages"
      });
    }
    
    const newReply = new Message({
      type_message: "channel",
      channel_id: channelId,
      sender_id: senderId,
      content,
      type: type || "text",
      file_url,
      thread_parent_id: messageId,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const savedReply = await newReply.save();
    
    // Populate the reply
    const populatedReply = await Message.findById(savedReply._id)
      .populate("sender_id")
      .populate("channel_id");
    
    // Emit socket event for new thread reply
    const io = req.app.get('io');
    
    // Emit to thread room and channel room
    io.to(`thread-${messageId}`).emit('thread:reply', populatedReply);
    io.to(`channel-${channelId}`).emit('thread:new', {
      threadId: messageId,
      message: populatedReply
    });
    
    // Notify the original message sender if it's not the current user
    if (parentMessage.sender_id.toString() !== senderId) {
      const sender = await User.findById(senderId);
      const notification = new Notification({
        user_id: parentMessage.sender_id,
        type: "thread_reply",
        type_id: messageId,
        workspace_id: channel.workspace_id,
        content: `${sender.name} replied to your message in #${channel.name}`,
        related_id: senderId,
        is_read: false,
        created_at: new Date()
      });
      
      await notification.save();
      
      // Send notification to the original message sender
      io.to(`user-${parentMessage.sender_id}`).emit(
        'notification:new', 
        await notification.populate("user_id workspace_id")
      );
    }
    
    return res.status(201).json({
      success: true,
      data: populatedReply
    });
  } catch (error) {
    console.error("Error replying to thread in channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get thread replies for a channel message
export const getChannelThreadReplies = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.messageId;
    
    // Validate parent message exists and is a channel message
    const parentMessage = await Message.findById(messageId).populate("sender_id");
    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: "Parent message not found"
      });
    }
    
    if (parentMessage.type_message !== "channel") {
      return res.status(400).json({
        success: false,
        message: "Parent message is not a channel message"
      });
    }
    
    // Get the channel ID from the parent message
    const channelId = parentMessage.channel_id;
    
    // Check if user is a member of the channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }
    
    const isMember = channel.members.some(member => member.user.toString() === userId);
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of the channel to view thread replies"
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get thread replies
    const replies = await Message.find({
      thread_parent_id: messageId
    })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit)
      .populate("sender_id");
    
    const total = await Message.countDocuments({
      thread_parent_id: messageId
    });
    
    return res.status(200).json({
      success: true,
      count: replies.length,
      total,
      data: {
        parent: parentMessage,
        replies
      }
    });
  } catch (error) {
    console.error("Error fetching thread replies in channel:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 