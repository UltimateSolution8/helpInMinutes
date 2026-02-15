/**
 * Socket Service
 * Core socket management for connection tracking and broadcasting
 */

const logger = require('../config/logger');
const { getRedisClient } = require('../config/redis');
const Connection = require('../models/Connection');

class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize with Socket.io instance
   */
  initialize(io) {
    this.io = io;
    logger.info('SocketService initialized');
  }

  /**
   * Get Socket.io instance
   */
  getIO() {
    if (!this.io) {
      throw new Error('SocketService not initialized. Call initialize() first.');
    }
    return this.io;
  }

  /**
   * Store connection in Redis
   */
  async storeConnection(socket) {
    try {
      const redis = getRedisClient();
      const connection = new Connection({
        socketId: socket.id,
        userId: socket.userId,
        role: socket.userRole,
        helperId: socket.helperId,
        deviceId: socket.deviceId,
        platform: socket.platform,
        connectedAt: new Date().toISOString(),
        ip: socket.handshake.address
      });

      // Store connection details
      await redis.setex(
        connection.getRedisKey(),
        86400, // 24 hours
        JSON.stringify(connection.toRedisHash())
      );

      // Add to user's socket set
      await redis.sadd(Connection.getUserSocketsKey(socket.userId), socket.id);
      await redis.expire(Connection.getUserSocketsKey(socket.userId), 86400);

      // Add to active connections
      await redis.sadd(Connection.getActiveConnectionsKey(), socket.id);

      logger.debug(`Connection stored: ${socket.id} for user ${socket.userId}`);
      return connection;
    } catch (error) {
      logger.error('Failed to store connection:', error);
      throw error;
    }
  }

  /**
   * Remove connection from Redis
   */
  async removeConnection(socket) {
    try {
      const redis = getRedisClient();

      await redis.del(`socket:${socket.id}`);
      await redis.srem(Connection.getUserSocketsKey(socket.userId), socket.id);
      await redis.srem(Connection.getActiveConnectionsKey(), socket.id);

      logger.debug(`Connection removed: ${socket.id} for user ${socket.userId}`);
    } catch (error) {
      logger.error('Failed to remove connection:', error);
      throw error;
    }
  }

  /**
   * Get user's active socket IDs
   */
  async getUserSockets(userId) {
    try {
      const redis = getRedisClient();
      return await redis.smembers(Connection.getUserSocketsKey(userId));
    } catch (error) {
      logger.error('Failed to get user sockets:', error);
      return [];
    }
  }

  /**
   * Get connection details by socket ID
   */
  async getConnection(socketId) {
    try {
      const redis = getRedisClient();
      const data = await redis.get(`socket:${socketId}`);
      return data ? Connection.fromRedisHash(JSON.parse(data)) : null;
    } catch (error) {
      logger.error('Failed to get connection:', error);
      return null;
    }
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId) {
    try {
      const sockets = await this.getUserSockets(userId);
      return sockets.length > 0;
    } catch (error) {
      logger.error('Failed to check user online status:', error);
      return false;
    }
  }

  /**
   * Get count of active connections
   */
  async getActiveConnectionCount() {
    try {
      const redis = getRedisClient();
      return await redis.scard(Connection.getActiveConnectionsKey());
    } catch (error) {
      logger.error('Failed to get connection count:', error);
      return 0;
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event, data) {
    if (!this.io) {
      logger.error('SocketService not initialized');
      return;
    }
    this.io.emit(event, data);
  }

  /**
   * Broadcast to specific room
   */
  broadcastToRoom(room, event, data) {
    if (!this.io) {
      logger.error('SocketService not initialized');
      return;
    }
    this.io.to(room).emit(event, data);
  }

  /**
   * Send to specific user
   */
  async sendToUser(userId, event, data) {
    if (!this.io) {
      logger.error('SocketService not initialized');
      return false;
    }

    const room = `user:${userId}`;
    this.io.to(room).emit(event, data);
    
    // Check if user received the message
    const sockets = await this.getUserSockets(userId);
    return sockets.length > 0;
  }

  /**
   * Send to specific helper
   */
  async sendToHelper(helperId, event, data) {
    if (!this.io) {
      logger.error('SocketService not initialized');
      return false;
    }

    const room = `helper:${helperId}`;
    this.io.to(room).emit(event, data);
    return true;
  }

  /**
   * Send to task room
   */
  sendToTask(taskId, event, data) {
    if (!this.io) {
      logger.error('SocketService not initialized');
      return;
    }

    const room = `task:${taskId}`;
    this.io.to(room).emit(event, data);
  }

  /**
   * Send to all helpers
   */
  sendToHelpers(event, data) {
    if (!this.io) {
      logger.error('SocketService not initialized');
      return;
    }

    this.io.to('role:HELPER').emit(event, data);
  }

  /**
   * Send to all buyers
   */
  sendToBuyers(event, data) {
    if (!this.io) {
      logger.error('SocketService not initialized');
      return;
    }

    this.io.to('role:BUYER').emit(event, data);
  }

  /**
   * Get all sockets in a room
   */
  async getSocketsInRoom(room) {
    if (!this.io) {
      return [];
    }

    const sockets = await this.io.in(room).fetchSockets();
    return sockets.map(s => ({
      id: s.id,
      userId: s.userId,
      userRole: s.userRole
    }));
  }

  /**
   * Get room size (number of clients)
   */
  async getRoomSize(room) {
    if (!this.io) {
      return 0;
    }

    const sockets = await this.io.in(room).fetchSockets();
    return sockets.length;
  }

  /**
   * Disconnect all sockets for a user
   */
  async disconnectUser(userId, reason = 'forced_disconnect') {
    try {
      const sockets = await this.getUserSockets(userId);
      
      for (const socketId of sockets) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }

      logger.info(`Disconnected user ${userId}: ${reason}`);
      return sockets.length;
    } catch (error) {
      logger.error('Failed to disconnect user:', error);
      return 0;
    }
  }

  /**
   * Join socket to room
   */
  joinRoom(socketId, room) {
    if (!this.io) {
      return false;
    }

    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(room);
      return true;
    }
    return false;
  }

  /**
   * Leave room
   */
  leaveRoom(socketId, room) {
    if (!this.io) {
      return false;
    }

    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(room);
      return true;
    }
    return false;
  }

  /**
   * Get server statistics
   */
  async getStats() {
    if (!this.io) {
      return null;
    }

    const redis = getRedisClient();
    const activeConnections = await this.getActiveConnectionCount();

    return {
      activeConnections,
      serverTime: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}

// Export singleton instance
module.exports = new SocketService();
