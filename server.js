import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authroutes from "./routes/auth.js";
import otpRoutes from "./routes/otp.js";
import channel from "./routes/channelRoutes.js";
import workspace from "./routes/workspace.js";
import messagesRoutes from "./routes/messages.js";
import directMessageRoutes from "./routes/directMessages.js";
import channelMessageRoutes from "./routes/channelMessages.js";
import userRoutes from "./routes/user.js";
import epicRoutes from "./routes/epics.js";
import taskRoutes from "./routes/tasks.js";
import sprintRoutes from "./routes/sprints.js";
import bugRoutes from "./routes/bugs.js";
import invitationRoutes from "./routes/invitation.js";
import reportDailyRoutes from "./routes/reportDailies.js";
import taskStatsRoutes from "./routes/taskStats.js";
import workspaceMembersRoutes from "./routes/workspaceMembers.js";
import initSocket from "./sockets/socketHandler.js";
import { socketAuth } from "./middlewares/socketAuth.js";
import http from "http";
import { Server } from "socket.io";
import notificationRoutes from "./routes/notification.js";
import path from "path";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authroutes);
app.use("/api/otp", otpRoutes);
app.use("/api/channels", channel);
app.use("/api/workspaces", workspace);
app.use("/api/messages", messagesRoutes);
app.use("/api/dm", directMessageRoutes);
app.use("/api/channel-messages", channelMessageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/epics", epicRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/reports", reportDailyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/task-stats", taskStatsRoutes);
app.use("/api/workspace-members", workspaceMembersRoutes);

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO instance with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your client domain
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io instance available to routes
app.set("io", io);

app.use("/public", express.static(path.join(process.cwd(), "public")));

// Socket.IO middleware
io.use(socketAuth);

// Initialize Socket.IO
initSocket(io);

// Use the HTTP server to listen, not the Express app
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
