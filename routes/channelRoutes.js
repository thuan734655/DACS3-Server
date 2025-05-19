import express from "express";
import {
  getAllChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
  addMember,
  removeMember,
  joinChannel,
  leaveChannel,
} from "../controllers/channelController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// GET all channels with pagination
router.get("/", getAllChannels);

// GET channel by ID
router.get("/:id", authenticateToken, getChannelById);

// POST create new channel
router.post("/", authenticateToken, createChannel);

// PUT update channel
router.put("/:id", authenticateToken, updateChannel);

// DELETE channel
router.delete("/:id", authenticateToken, deleteChannel);

// PUT add member to channel (by admin/owner)
router.put("/:id/members", authenticateToken, addMember);

// DELETE remove member from channel (by admin/owner)
router.delete("/:id/members/:userId", authenticateToken, removeMember);

// POST join a channel (self-join)
router.post("/:id/join", authenticateToken, joinChannel);

// DELETE leave a channel (self-leave)
router.delete("/:id/leave", authenticateToken, leaveChannel);

export default router;
