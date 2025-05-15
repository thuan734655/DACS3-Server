import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from '../models/model_database/users.js';

dotenv.config();

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Socket.IO authentication middleware
 * 
 * Verifies the JWT token for socket connections and attaches the user to the socket.
 */
 const socketAuth = async (socket, next) => {
  try {
    // Extract token from auth header or query parameter
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.split(' ')[1] ||
                  socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error('Authentication token is missing'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user information
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    // Attach user object to socket for later use
    socket.user = {
      id: user._id.toString(),
      name: user.name,
      avatar: user.avatar
    };
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed: ' + error.message));
  }
};

export  { auth, socketAuth };
