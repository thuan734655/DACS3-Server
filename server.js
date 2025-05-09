import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authroutes from "./routes/auth.js";
import otpRoutes from "./routes/otp.js";
import channel from "./routes/channelRoutes.js";
import workspace from "./routes/workspace.js";
import initSocket from "./sockets/socketHandler.js";
import { socketAuth } from "./middleware/socketAuth.js";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authroutes);
app.use("/api/otp", otpRoutes);
app.use("/api/channel", channel);
app.use("/api/workspace", workspace);

// Tạo server HTTP
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO middleware
io.use(socketAuth);

// Khởi tạo Socket.IO
initSocket(io);

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on all interfaces");
});
