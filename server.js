import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authroutes from "./routes/auth.js";
import otpRoutes from "./routes/otp.js";
import channel from "./routes/channelRoutes.js";
import workspace from "./routes/workspace.js";
import initSocket from "./sockets/socketHandler.js";
import { socketAuth } from "./middlewares/socketAuth.js";
import http from "http";
import { Server } from "socket.io";
import home from "./routes/home.js";
import taskRoutes from "./routes/task.js";
import epicRoutes from "./routes/epic.js";
import sprintRoutes from "./routes/sprint.js";
import reportDailyRoutes from "./routes/reportDaily.js";
import notificationRoutes from "./routes/notification.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authroutes);
app.use("/api/otp", otpRoutes);
app.use("/api/channel", channel);
app.use("/api/workspaces", workspace);
app.use("/api/home", home);
app.use("/api/tasks", taskRoutes);
app.use("/api/epics", epicRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/reports", reportDailyRoutes);
app.use("/api/notifications", notificationRoutes);

// Create HTTP server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io instance available to routes
app.set('io', io);

// Socket.IO middleware
io.use(socketAuth);

// Initialize Socket.IO
initSocket(io);

// Use the HTTP server to listen, not the Express app
server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on all interfaces");
});
