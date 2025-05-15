import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  replyToThread,
  getThreadReplies
} from "../controllers/directMessageController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET all conversations for the current user
router.get("/conversations", getConversations);

// GET message history with a specific user
router.get("/:userId", getMessages);

// POST send a new direct message to a user
router.post("/:userId", sendMessage);

// GET thread replies for a direct message
router.get("/threads/:messageId", getThreadReplies);

// POST reply to a thread in a direct message
router.post("/threads/:messageId", replyToThread);

export default router; 