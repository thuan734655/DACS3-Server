const userSocketMap = {};

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    userSocketMap[socket.user.userId] = socket.id;

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`${socket.user.username} joined room: ${room}`);
      io.to(room).emit("notification", {
        message: `${socket.user.username} has joined the room`,
        from: "system",
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
      delete userSocketMap[socket.user.userId];
    });
  });
};

export default initSocket;
