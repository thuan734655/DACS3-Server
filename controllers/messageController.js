import Message from "../models/model_database/messages.js";
import Channel from "../models/model_database/channels.js";

// Get all messages with pagination and filters
export const getAllMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Filter by channel_id if provided
    if (req.query.channel_id) {
      query.channel_id = req.query.channel_id;
      query.type_message = "channel";
    }
    
    // Filter by direct message participants if provided
    if (req.query.sender_id && req.query.receiver_id) {
      // For direct messages, we need to find messages where the user is either sender or receiver
      query.$or = [
        { sender_id: req.query.sender_id, reciver_id: req.query.receiver_id, type_message: "direct" },
        { sender_id: req.query.receiver_id, reciver_id: req.query.sender_id, type_message: "direct" }
      ];
    }

    // Filter by thread parent if provided
    if (req.query.thread_parent_id) {
      query.thread_parent_id = req.query.thread_parent_id;
    } else {
      // By default, get only top-level messages (not thread replies)
      query.thread_parent_id = null;
    }
    
    // Sort by created_at descending (newest first)
    const messages = await Message.find(query)
      .sort({ created_at: -1 })
      .populate("sender_id")
      .populate("reciver_id")
      .populate("channel_id")
      .skip(skip)
      .limit(limit);
    
    // Reverse the array to have oldest messages first (better for chat UI)
    messages.reverse();

    const total = await Message.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: messages.length,
      total,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get message by ID
export const getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate("sender_id")
      .populate("reciver_id")
      .populate("channel_id");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Create a new message
export const createMessage = async (req, res) => {
  try {
    const { 
      type_message, 
      reciver_id, 
      channel_id, 
      sender_id, 
      content,
      type,
      file_url,
      thread_parent_id
    } = req.body;

    // Validate message type
    if (type_message === "channel" && !channel_id) {
      return res.status(400).json({
        success: false,
        message: "Channel ID is required for channel messages",
      });
    }

    if (type_message === "direct" && !reciver_id) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required for direct messages",
      });
    }

    const newMessage = new Message({
      type_message,
      reciver_id: type_message === "direct" ? reciver_id : undefined,
      channel_id: type_message === "channel" ? channel_id : undefined,
      sender_id,
      content,
      type: type || "text",
      file_url,
      thread_parent_id
    });

    const savedMessage = await newMessage.save();
    
    // Populate the created message
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender_id")
      .populate("reciver_id")
      .populate("channel_id");

    // If it's a channel message, update the channel's last message info
    if (type_message === "channel") {
      await Channel.findByIdAndUpdate(channel_id, {
        last_message_id: savedMessage._id,
        last_message_preview: content ? 
          (content.length > 50 ? content.substring(0, 50) + "..." : content) : 
          (type === "image" ? "Shared an image" : "New message"),
        last_message_at: new Date()
      });
    }

    // Emit socket event for new message
    const io = req.app.get('io');
    
    if (type_message === "channel") {
      // Emit to channel room
      io.to(`channel-${channel_id}`).emit('message:created', populatedMessage);
    } else if (type_message === "direct") {
      // Emit to both sender and receiver
      io.to(`user-${sender_id}`).emit('message:created', populatedMessage);
      io.to(`user-${reciver_id}`).emit('message:created', populatedMessage);
    }
    
    // If it's a thread reply, also notify the thread participants
    if (thread_parent_id) {
      io.to(`thread-${thread_parent_id}`).emit('thread:reply', populatedMessage);
    }

    return res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update a message
export const updateMessage = async (req, res) => {
  try {
    const { content } = req.body;

    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }
    
    // Only the sender should be able to edit their message
    if (message.sender_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only edit your own messages",
      });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      {
        content,
        updated_at: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("sender_id")
      .populate("reciver_id")
      .populate("channel_id");

    // Emit socket event for message update
    const io = req.app.get('io');
    
    if (message.type_message === "channel") {
      // Emit to channel room
      io.to(`channel-${message.channel_id}`).emit('message:updated', updatedMessage);
    } else if (message.type_message === "direct") {
      // Emit to both sender and receiver
      io.to(`user-${message.sender_id}`).emit('message:updated', updatedMessage);
      io.to(`user-${message.reciver_id}`).emit('message:updated', updatedMessage);
    }
    
    // If it's a thread message, also notify the thread
    if (message.thread_parent_id) {
      io.to(`thread-${message.thread_parent_id}`).emit('thread:updated', updatedMessage);
    }

    return res.status(200).json({
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }
    
    // Only the sender should be able to delete their message
    if (message.sender_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own messages",
      });
    }
    
    // Store message details for notification before deletion
    const messageId = message._id;
    const channelId = message.channel_id;
    const senderId = message.sender_id;
    const receiverId = message.reciver_id;
    const threadParentId = message.thread_parent_id;
    const typeMessage = message.type_message;
    
    // Delete the message
    await Message.findByIdAndDelete(req.params.id);

    // Emit socket event for message deletion
    const io = req.app.get('io');
    
    if (typeMessage === "channel") {
      // Emit to channel room
      io.to(`channel-${channelId}`).emit('message:deleted', { messageId });
    } else if (typeMessage === "direct") {
      // Emit to both sender and receiver
      io.to(`user-${senderId}`).emit('message:deleted', { messageId });
      io.to(`user-${receiverId}`).emit('message:deleted', { messageId });
    }
    
    // If it's a thread message, also notify the thread
    if (threadParentId) {
      io.to(`thread-${threadParentId}`).emit('thread:messageDeleted', { messageId });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get replies in a thread
export const getThreadReplies = async (req, res) => {
  try {
    const parentId = req.params.parentId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const replies = await Message.find({ thread_parent_id: parentId })
      .sort({ created_at: 1 })
      .populate("sender_id")
      .skip(skip)
      .limit(limit);
    
    const total = await Message.countDocuments({ thread_parent_id: parentId });
    
    return res.status(200).json({
      success: true,
      count: replies.length,
      total,
      data: replies,
    });
  } catch (error) {
    console.error("Error fetching thread replies:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}; 