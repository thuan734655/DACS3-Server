const userSocketMap = {};

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    userSocketMap[socket.user.userId] = socket.id;

    // Join user to their own room for direct notifications
    socket.join(`user_${socket.user.userId}`);

    // Handle joining a workspace room
    socket.on("joinWorkspace", (workspaceId) => {
      const room = `workspace_${workspaceId}`;
      socket.join(room);
      console.log(`${socket.user.username} joined workspace: ${room}`);
    });

    // Handle joining a channel room
    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`${socket.user.username} joined room: ${room}`);
      io.to(room).emit("notification", {
        message: `${socket.user.username} has joined the room`,
        from: "system",
      });
    });

    // Handle leaving a workspace room
    socket.on("leaveWorkspace", (workspaceId) => {
      const room = `workspace_${workspaceId}`;
      socket.leave(room);
      console.log(`${socket.user.username} left workspace: ${room}`);
    });

    // Handle new notification event
    socket.on("sendNotification", (notification) => {
      // Emit to specific workspace
      if (notification.workspace_id) {
        io.to(`workspace_${notification.workspace_id}`).emit("notification:new", notification);
      }
      
      // Emit to specific user if targeted
      if (notification.user_id) {
        io.to(`user_${notification.user_id}`).emit("notification:new", notification);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
      delete userSocketMap[socket.user.userId];
    });
  });
};

export default socketHandler;
