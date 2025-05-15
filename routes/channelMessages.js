import express from "express";
import {
  getChannelMessages,
  sendChannelMessage,
  replyToChannelThread,
  getChannelThreadReplies
} from "../controllers/channelMessageController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET all messages for a specific channel
router.get("/:channelId", getChannelMessages);

// POST send a new message to a channel
router.post("/:channelId", sendChannelMessage);

// GET thread replies for a channel message
router.get("/threads/:messageId", getChannelThreadReplies);

// POST reply to a thread in a channel
router.post("/threads/:messageId", replyToChannelThread);

export default router; 