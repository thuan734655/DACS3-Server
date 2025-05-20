import User from '../models/model_database/users.js';
import Message from '../models/model_database/messages.js';
import Channel from '../models/model_database/channels.js';
import Workspace from '../models/model_database/workspaces.js';
import Notification from '../models/model_database/notifications.js';

const initSocket = (io) => {
  // Keep track of online users
  const onlineUsers = new Map();
  
  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId}`);
    
    // Store socket id for this user
    onlineUsers.set(userId, socket.id);
    
    // Join user's personal room
    socket.join(`user-${userId}`);
    
    // Handle joining workspace rooms
    socket.on('join:workspace', async (workspaceId) => {
      console.log(`User ${userId} joining workspace ${workspaceId}`);
      
      try {
        // Verify that user is a member of this workspace
        const workspace = await Workspace.findById(workspaceId);
        
        if (!workspace) {
          socket.emit('error', { message: 'Workspace not found' });
          return;
        }
        
        const isMember = workspace.members.some(
          member => member.user_id.toString() === userId
        );
        
        if (!isMember) {
          socket.emit('error', { message: 'Unauthorized to join this workspace' });
          return;
        }
        
        // Join workspace room
        socket.join(`workspace-${workspaceId}`);
        socket.emit('joined:workspace', { workspaceId });
      } catch (error) {
        console.error('Error joining workspace:', error);
        socket.emit('error', { message: 'Failed to join workspace' });
      }
    });
    
    // Handle joining channel rooms
    socket.on('join:channel', async (channelId) => {
      console.log(`User ${userId} joining channel ${channelId}`);
      
      try {
        // Verify that user is a member of this channel
        const channel = await Channel.findById(channelId);
        
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }
        
        const isMember = channel.members.some(
          member => member.user.toString() === userId
        );
        
        if (!isMember && !channel.is_private) {
          // Add user to channel if it's not private
          channel.members.push({
            user: userId,
            joined_at: new Date()
          });
          
          await channel.save();
        } else if (!isMember) {
          socket.emit('error', { message: 'Unauthorized to join this channel' });
          return;
        }
        
        // Join channel room
        socket.join(`channel-${channelId}`);
        socket.emit('joined:channel', { channelId });
        
        // Update user's last read timestamp for this channel
        await Channel.findOneAndUpdate(
          { _id: channelId, 'members.user': userId },
          { 'members.$.last_read': new Date() }
        );
      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });
    
    // Handle joining thread rooms
    socket.on('join:thread', async (threadParentId) => {
      console.log(`User ${userId} joining thread ${threadParentId}`);
      
      try {
        // Check that thread parent message exists
        const parentMessage = await Message.findById(threadParentId);
        
        if (!parentMessage) {
          socket.emit('error', { message: 'Thread not found' });
          return;
        }
        
        // Thread access control would go here if needed
        // ...
        
        // Join thread room
        socket.join(`thread-${threadParentId}`);
        socket.emit('joined:thread', { threadParentId });
      } catch (error) {
        console.error('Error joining thread:', error);
        socket.emit('error', { message: 'Failed to join thread' });
      }
    });
    
    // Handle typing events for channels
    socket.on('typing:channel', ({ channelId, isTyping }) => {
      // Broadcast to all users in channel except sender
      socket.to(`channel-${channelId}`).emit('user:typing', {
        userId,
        channelId,
        isTyping
      });
    });
    
    // Handle typing events for direct messages
    socket.on('typing:direct', ({ receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user:typing', {
          userId,
          isTyping
        });
      }
    });
    
    // Handle user status updates
    socket.on('user:status', ({ status }) => {
      // Broadcast to all connected users that this user has changed status
      socket.broadcast.emit('user:statusChanged', {
        userId,
        status
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      
      // Remove user from online users
      onlineUsers.delete(userId);
      
      // Broadcast disconnection to all connected users
      socket.broadcast.emit('user:offline', { userId });
    });
  });
  
  console.log('Socket.IO initialized');
  return io;
};

export default initSocket; 