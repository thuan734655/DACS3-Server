import { Router } from "express";
import {
  createChannelController,
  getAllChannelsController,
  getChannelByIdController,
  updateChannelController,
  deleteChannelController,
  addMemberController,
  removeMemberController,
} from "../controllers/channelController.js";
import validate from "../middlewares/validate_middelware.js";
import {
  createChannelSchema,
  updateChannelSchema,
  addMemberSchema,
} from "../helper/joi/channel_schema.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken);

// Tạo channel mới
router.post("/", validate(createChannelSchema), createChannelController);

// Lấy tất cả channel trong workspace
router.get("/workspace/:workspace_id", getAllChannelsController);

// Lấy channel theo ID
router.get("/:id", getChannelByIdController);

// Cập nhật channel
router.put("/:id", validate(updateChannelSchema), updateChannelController);

// Xóa channel
router.delete("/:id", deleteChannelController);

// Thêm thành viên vào channel
router.post("/:id/members", validate(addMemberSchema), addMemberController);

// Xóa thành viên khỏi channel
router.delete("/:id/members/:userId", removeMemberController);

export default router;
