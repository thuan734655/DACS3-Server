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
  leaveChannel
} from "../controllers/channelController.js";
import authenticateToken from "../middlewares/authenticateToken.js";


const router = express.Router();

router.use(authenticateToken);

// GET all channels with pagination
router.get("/", getAllChannels);

// GET channel by ID
router.get("/:id", getChannelById);

// POST create new channel
router.post("/", createChannel);

// PUT update channel
router.put("/:id", updateChannel);

// DELETE channel
router.delete("/:id", deleteChannel);

// PUT add member to channel (by admin/owner)
router.put("/:id/members", addMember);

// DELETE remove member from channel (by admin/owner)
router.delete("/:id/members/:userId", removeMember);

// POST join a channel (self-join)
router.post("/:id/join", joinChannel);

// DELETE leave a channel (self-leave)
router.delete("/:id/leave", leaveChannel);

export default router; 