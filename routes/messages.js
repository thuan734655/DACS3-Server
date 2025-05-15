import express from "express";
import {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  getThreadReplies
} from "../controllers/messageController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

router.use(authenticateToken);

// GET all messages with pagination and filters
router.get("/", getAllMessages);

// GET message by ID
router.get("/:id", getMessageById);

// POST create new message
router.post("/", createMessage);

// PUT update message
router.put("/:id", updateMessage);

// DELETE message
router.delete("/:id", deleteMessage);

// GET thread replies for a parent message
router.get("/thread/:parentId", getThreadReplies);

export default router; 