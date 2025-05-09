import express from "express";
import {
  createChannel,
  getChannel,
  updateChannel,
  deleteChannel,
  getChannelsByWorkspace,
} from "../controllers/channelController.js";

const router = express.Router();

router.post("/", createChannel);
router.get("/:id", getChannel);
router.put("/:id", updateChannel);
router.delete("/:id", deleteChannel);
router.get("/workspace/:workspaceId", getChannelsByWorkspace);

export default router;
    