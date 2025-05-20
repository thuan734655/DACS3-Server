import { body, param, query, validationResult } from "express-validator";
import Invitation from "../models/model_database/invitations.js";
import Workspace from "../models/model_database/workspaces.js";
import User from "../models/model_database/users.js";
import Account from "../models/model_database/accounts.js";
import Notification from "../models/model_database/notifications.js";
import sendEmail from "../helper/mail/sendMail.js";
import mongoose from "mongoose";

// Validation middleware
const validateSendInvitation = [
  body("email").isEmail().withMessage("Invalid email"),
  body("workspace_id").isMongoId().withMessage("Invalid workspace ID"),
  body("invited_by")
    .optional()
    .isMongoId()
    .withMessage("Invalid invited_by ID"),
];

const validateInvitationId = [
  param("invitationId").isMongoId().withMessage("Invalid invitation ID"),
];

const validateGetInvitations = [
  query("status")
    .optional()
    .isIn(["pending", "accepted", "rejected"])
    .withMessage("Invalid status"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

// Gửi lời mời tham gia workspace (Create)
export const sendWorkspaceInvitation = [
  validateSendInvitation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, workspace_id, invited_by } = req.body;
      // Sử dụng invited_by từ request hoặc từ user authentication nếu có
      const inviterId = invited_by || req.user.id;

      if (!inviterId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required. Please provide invited_by or valid authentication.",
        });
      }

      // Kiểm tra workspace
      const workspace = await Workspace.findById(workspace_id);
      if (!workspace) {
        return res
          .status(404)
          .json({ success: false, message: "Workspace not found" });
      }

      // Tìm account bằng email
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Account with this email not found",
        });
      }

      // // Kiểm tra đã là thành viên
      // const alreadyMember = workspace.members.some(
      //   (member) => member.user_id.toString() === user._id.toString()
      // );
      // if (alreadyMember) {
      //   return res
      //     .status(400)
      //     .json({ success: false, message: "User is already a member" });
      // }

      // Tạo lời mời
      const invitation = new Invitation({
        type_invitation: "workspace",
        workspace_id,
        user_id: account.user_id,
        email,
        invited_by: inviterId,
        status: "pending",
      });
      await invitation.save();

      // Gửi email
      const emailContent = `You are invited to join workspace ${workspace.name}. Click to accept: /invitation/accept/${invitation._id}`;
      await sendEmail(email, "Workspace Invitation", emailContent);

      // Tạo thông báo
      const notification = new Notification({
        user_id: account.user_id,
        type: "invitation",
        type_id: invitation._id,
        workspace_id,
        content: `Bạn đã được mời tham gia workspace ${workspace.name}`,
      });
      await notification.save();

      // Emit Socket.IO
      const io = req.app.get("io");
      io.to(`user-${account.user_id}`).emit("notification:new", notification);

      return res.status(201).json({ success: true, data: invitation });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
];

// Lấy danh sách lời mời theo user_id với phân trang (Read - List)
export const getInvitations = [
  validateGetInvitations,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { status, page = 1, limit = 10 } = req.query;
   

const user_id = new mongoose.Types.ObjectId(req.user.id);
const query = { user_id };

      if (status) query.status = status;
      console.log("query", query);

      // Phân trang
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Invitation.countDocuments(query);
      const invitations = await Invitation.find(query)
        .populate("workspace_id", "name")
        .populate("invited_by", "username")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      console.log("invitations", invitations);

      return res.status(200).json({
        success: true,
        data: invitations,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
];

// Lấy chi tiết lời mời (Read - Detail)
export const getInvitationById = [
  validateInvitationId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { invitationId } = req.params;
      const user_id = req.user._id;

      const invitation = await Invitation.findOne({
        _id: invitationId,
        user_id,
      })
        .populate("workspace_id", "name")
        .populate("invited_by", "username");

      if (!invitation) {
        return res
          .status(404)
          .json({ success: false, message: "Invitation not found" });
      }

      return res.status(200).json({ success: true, data: invitation });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
];

// Chấp nhận lời mời (Update - Accept)
export const acceptWorkspaceInvitation = [
  validateInvitationId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { invitationId } = req.params;
      const user_id = req.user.id;

      // Tìm lời mời
      const invitation = await Invitation.findById(invitationId).populate(
        "workspace_id"
      );
      if (!invitation) {
        return res
          .status(404)
          .json({ success: false, message: "Invitation not found" });
      }

      // Kiểm tra quyền
      if (invitation.user_id.toString() !== user_id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      // Kiểm tra trạng thái
      if (invitation.status !== "pending") {
        return res
          .status(400)
          .json({ success: false, message: "Invitation already processed" });
      }

      // Cập nhật trạng thái
      invitation.status = "accepted";
      await invitation.save();

      // Thêm vào workspace
      const workspace = await Workspace.findById(invitation.workspace_id);
      if (!workspace) {
        return res
          .status(404)
          .json({ success: false, message: "Workspace not found" });
      }

      // Check if user is already a member
      const memberExists = workspace.members.some(
        (member) => member.user_id.toString() === user_id.toString()
      );

      if (!memberExists) {
        // Add user to workspace with proper role casing ("Member" instead of "member")
        workspace.members.push({ user_id, role: "Member" });
        await workspace.save();
      }

      // Get populated workspace
      const updatedWorkspace = await Workspace.findById(invitation.workspace_id)
        .populate("created_by")
        .populate("members.user_id");

      // Create notification for the person who sent the invitation
      const inviterNotification = new Notification({
        user_id: invitation.invited_by,
        type: "invitation",
        type_id: workspace._id,
        workspace_id: workspace._id,
        content: `${
          req.user.username || "User"
        } accepted your invitation to workspace "${workspace.name}"`,
        related_id: user_id,
        is_read: false,
        created_at: new Date(),
      });

      await inviterNotification.save();

      // Emit socket events
      const io = req.app.get("io");

      // Notify the inviter
      const populatedInviterNotification = await inviterNotification.populate(
        "user_id workspace_id"
      );
      io.to(`user-${invitation.invited_by}`).emit(
        "notification:new",
        populatedInviterNotification
      );

      // Notify all workspace members about the new member
      updatedWorkspace.members.forEach((member) => {
        if (member.user_id._id.toString() !== user_id.toString()) {
          io.to(`user-${member.user_id._id}`).emit("workspace:memberAdded", {
            workspace: updatedWorkspace,
            newMember: user_id,
          });
        }
      });

      // Emit workspace:joined event to the new member
      io.to(`user-${user_id}`).emit("workspace:joined", updatedWorkspace);

      return res.status(200).json({
        success: true,
        message: "You have joined the workspace successfully",
        data: updatedWorkspace,
      });
    } catch (error) {
      console.error("Error accepting workspace invitation:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
];

// Từ chối lời mời (Update - Reject)
export const rejectWorkspaceInvitation = [
  validateInvitationId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { invitationId } = req.params;
      const user_id = req.user.id;

      // Tìm lời mời
      const invitation = await Invitation.findById(invitationId);
      if (!invitation) {
        return res
          .status(404)
          .json({ success: false, message: "Invitation not found" });
      }

      // Kiểm tra quyền
      if (invitation.user_id.toString() !== user_id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      // Kiểm tra trạng thái
      if (invitation.status !== "pending") {
        return res
          .status(400)
          .json({ success: false, message: "Invitation already processed" });
      }

      // Cập nhật trạng thái
      invitation.status = "rejected";
      await invitation.save();

      // Tạo thông báo cho người mời
      const notification = new Notification({
        user_id: invitation.invited_by,
        type: "invitation_rejected",
        type_id: invitation._id,
        workspace_id: invitation.workspace_id,
        content: `${req.user.username} has rejected your invitation`,
      });
      await notification.save();

      // Emit Socket.IO
      io.to(`user-${invitation.invited_by}`).emit(
        "notification:new",
        notification
      );

      return res.status(200).json({
        success: true,
        message: "Invitation rejected",
        data: invitation,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
];

// Xóa lời mời (Delete)
export const deleteInvitation = [
  validateInvitationId,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { invitationId } = req.params;
      const user_id = req.user._id;

      // Tìm lời mời
      const invitation = await Invitation.findById(invitationId);
      if (!invitation) {
        return res
          .status(404)
          .json({ success: false, message: "Invitation not found" });
      }

      // Kiểm tra quyền
      if (
        invitation.user_id.toString() !== user_id.toString() &&
        invitation.invited_by.toString() !== user_id.toString()
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      // Xóa lời mời
      await invitation.deleteOne();

      // Tạo thông báo cho người còn lại
      const otherUserId =
        invitation.user_id.toString() === user_id.toString()
          ? invitation.invited_by
          : invitation.user_id;
      const notification = new Notification({
        user_id: otherUserId,
        type: "invitation_deleted",
        type_id: invitation._id,
        workspace_id: invitation.workspace_id,
        content: `An invitation has been deleted`,
      });
      await notification.save();

      // Emit Socket.IO
      io.to(`user-${otherUserId}`).emit("notification:new", notification);

      return res
        .status(200)
        .json({ success: true, message: "Invitation deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
];
