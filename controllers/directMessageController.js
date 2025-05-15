import Message from "../models/model_database/messages.js";
import User from "../models/model_database/users.js";
import mongoose from "mongoose";

// Get direct message conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all direct messages where the user is either sender or receiver
    // We're using aggregation to get the most recent message for each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          type_message: "direct",
          $or: [
            { sender_id: mongoose.Types.ObjectId(userId) },
            { reciver_id: mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        // Group by the other user in the conversation
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ["$sender_id", mongoose.Types.ObjectId(userId)] },
              then: "$reciver_id",
              else: "$sender_id",
            },
          },
        },
      },
      {
        $sort: { created_at: -1 }, // Sort by most recent messages first
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          user: 1,
          lastMessage: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get direct messages between two users with pagination
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate that the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Query direct messages between the two users
    const query = {
      type_message: "direct",
      $or: [
        { sender_id: userId, reciver_id: otherUserId },
        { sender_id: otherUserId, reciver_id: userId },
      ],
      // Only get top-level messages (not thread replies)
      thread_parent_id: null,
    };

    const messages = await Message.find(query)
      .sort({ created_at: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .populate("sender_id")
      .populate("reciver_id");

    // Reverse to get oldest messages first (better for chat UI)
    messages.reverse();

    const total = await Message.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: messages.length,
      total,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new direct message
export const sendMessage = async (req, res) => {
  try {
    const { content, type, file_url, thread_parent_id } = req.body;
    const senderId = req.user.id;
    const receiverId = req.params.userId;

    // Validate that the receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // Don't allow sending messages to yourself
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send direct messages to yourself",
      });
    }

    const newMessage = new Message({
      type_message: "direct",
      reciver_id: receiverId,
      sender_id: senderId,
      content,
      type: type || "text",
      file_url,
      thread_parent_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedMessage = await newMessage.save();

    // Populate the message
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("sender_id")
      .populate("reciver_id");

    // Emit socket event for new message
    const io = req.app.get("io");

    // Emit to both sender and receiver
    io.to(`user-${senderId}`).emit("message:created", populatedMessage);
    io.to(`user-${receiverId}`).emit("message:created", populatedMessage);

    // If it's a thread reply, also notify the thread participants
    if (thread_parent_id) {
      io.to(`thread-${thread_parent_id}`).emit(
        "thread:reply",
        populatedMessage
      );
    }

    return res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending direct message:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a thread reply in a direct message conversation
export const replyToThread = async (req, res) => {
  try {
    const { content, type, file_url } = req.body;
    const senderId = req.user.id;
    const parentMessageId = req.params.messageId;

    // Validate parent message exists and is a direct message
    const parentMessage = await Message.findById(parentMessageId);
    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: "Parent message not found",
      });
    }

    if (parentMessage.type_message !== "direct") {
      return res.status(400).json({
        success: false,
        message: "Parent message is not a direct message",
      });
    }

    // Determine the receiver (the other user in the conversation)
    const receiverId =
      parentMessage.sender_id.toString() === senderId
        ? parentMessage.reciver_id.toString()
        : parentMessage.sender_id.toString();

    const newReply = new Message({
      type_message: "direct",
      reciver_id: receiverId,
      sender_id: senderId,
      content,
      type: type || "text",
      file_url,
      thread_parent_id: parentMessageId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedReply = await newReply.save();

    // Populate the reply
    const populatedReply = await Message.findById(savedReply._id)
      .populate("sender_id")
      .populate("reciver_id");

    // Emit socket event for new thread reply
    const io = req.app.get("io");

    // Emit to thread room, sender, and receiver
    io.to(`thread-${parentMessageId}`).emit("thread:reply", populatedReply);
    io.to(`user-${senderId}`).emit("thread:reply", populatedReply);
    io.to(`user-${receiverId}`).emit("thread:reply", populatedReply);

    return res.status(201).json({
      success: true,
      data: populatedReply,
    });
  } catch (error) {
    console.error("Error replying to thread in direct message:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get thread replies for a direct message
export const getThreadReplies = async (req, res) => {
  try {
    const userId = req.user.id;
    const parentMessageId = req.params.messageId;

    // Validate parent message exists and is a direct message
    const parentMessage = await Message.findById(parentMessageId)
      .populate("sender_id")
      .populate("reciver_id");

    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: "Parent message not found",
      });
    }

    if (parentMessage.type_message !== "direct") {
      return res.status(400).json({
        success: false,
        message: "Parent message is not a direct message",
      });
    }

    // Make sure the user is part of this conversation
    if (
      parentMessage.sender_id._id.toString() !== userId &&
      parentMessage.reciver_id._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this thread",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get thread replies
    const replies = await Message.find({
      thread_parent_id: parentMessageId,
    })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit)
      .populate("sender_id")
      .populate("reciver_id");

    const total = await Message.countDocuments({
      thread_parent_id: parentMessageId,
    });

    return res.status(200).json({
      success: true,
      count: replies.length,
      total,
      data: {
        parent: parentMessage,
        replies,
      },
    });
  } catch (error) {
    console.error("Error fetching thread replies in direct message:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
