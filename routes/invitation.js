import express from "express";
import {
  sendWorkspaceInvitation,
  getInvitations,
  getInvitationById,
  acceptWorkspaceInvitation,
  rejectWorkspaceInvitation,
  deleteInvitation,
} from "../controllers/invitationController.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// Gửi lời mời tham gia workspace
router.post("/workspace", sendWorkspaceInvitation);

// Lấy danh sách lời mời theo user_id với phân trang
router.get("/", getInvitations);

// Lấy chi tiết một lời mời
router.get("/:invitationId", getInvitationById);

// Chấp nhận lời mời
router.post("/accept/:invitationId", acceptWorkspaceInvitation);

// Từ chối lời mời
router.post("/reject/:invitationId", rejectWorkspaceInvitation);

// Xóa lời mời
router.delete("/:invitationId", deleteInvitation);

export default router;
