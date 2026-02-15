const jwt = require('jsonwebtoken');
const logger = require('./logger');
const { getRedisClient } = require('./redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

// Rate limiter for location updates (1 update per 2 seconds per user)
let locationRateLimiter;

function initializeRateLimiter() {
  const redisClient = getRedisClient();
  locationRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'location_limit',
    points: 1,
    duration: 2, // 2 seconds
  });
}

/**
 * Socket.io Authentication Middleware
 * Validates JWT token and sets user info on socket
 */
async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      logger.warn('Socket connection attempt without token');
      return next(new Error('Authentication error: Token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate required fields
    if (!decoded.userId || !decoded.role) {
      logger.warn('Socket token missing required fields');
      return next(new Error('Authentication error: Invalid token payload'));
    }

    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    socket.helperId = decoded.helperId || null;
    socket.deviceId = socket.handshake.auth.deviceId || socket.handshake.query.deviceId;
    socket.platform = socket.handshake.auth.platform || socket.handshake.query.platform || 'unknown';
    
    logger.info(`Socket authenticated: userId=${decoded.userId}, role=${decoded.role}, socketId=${socket.id}`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn('Socket authentication failed: Token expired');
      return next(new Error('Authentication error: Token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      logger.warn('Socket authentication failed: Invalid token');
      return next(new Error('Authentication error: Invalid token'));
    }
    logger.error('Socket authentication error:', err.message);
    next(new Error('Authentication error: ' + err.message));
  }
}

/**
 * Setup Socket.io Handlers
 * @param {Server} io - Socket.io server instance
 */
function setupSocketHandlers(io) {
  // Initialize rate limiter
  try {
    initializeRateLimiter();
  } catch (error) {
    logger.error('Failed to initialize rate limiter:', error);
  }

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Connection handler
  io.on('connection', async (socket) => {
    logger.info(`User connected: ${socket.userId}, Role: ${socket.userRole}, Socket ID: ${socket.id}`);

    // Join user-specific room for direct messages
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // If helper, join helper-specific room
    if (socket.helperId) {
      socket.join(`helper:${socket.helperId}`);
    }

    // Store connection in Redis
    await storeConnection(socket);
    
    // Update presence status
    await updatePresence(socket.userId, 'online', socket);

    // Send connection acknowledgment
    socket.emit('connection:established', {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole,
      timestamp: new Date().toISOString()
    });

    // ==========================================
    // Task Room Management
    // ==========================================
    
    /**
     * Join task room
     * Client -> Server: { taskId }
     */
    socket.on('join:task', async (data) => {
      try {
        const { taskId } = data;
        
        if (!taskId) {
          return socket.emit('error', { message: 'Task ID required' });
        }

        const roomName = `task:${taskId}`;
        socket.join(roomName);
        
        logger.info(`User ${socket.userId} joined task room ${taskId}`);
        
        socket.emit('task:joined', { 
          taskId, 
          room: roomName,
          timestamp: new Date().toISOString()
        });

        // Notify other room members
        socket.to(roomName).emit('task:member_joined', {
          taskId,
          userId: socket.userId,
          role: socket.userRole,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error joining task room:', error);
        socket.emit('error', { message: 'Failed to join task room' });
      }
    });

    /**
     * Leave task room
     * Client -> Server: { taskId }
     */
    socket.on('leave:task', async (data) => {
      try {
        const { taskId } = data;
        
        if (!taskId) {
          return socket.emit('error', { message: 'Task ID required' });
        }

        const roomName = `task:${taskId}`;
        socket.leave(roomName);
        
        logger.info(`User ${socket.userId} left task room ${taskId}`);
        
        socket.emit('task:left', { 
          taskId, 
          room: roomName,
          timestamp: new Date().toISOString()
        });

        // Notify other room members
        socket.to(roomName).emit('task:member_left', {
          taskId,
          userId: socket.userId,
          role: socket.userRole,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error leaving task room:', error);
        socket.emit('error', { message: 'Failed to leave task room' });
      }
    });

    // ==========================================
    // Location Updates (Helper -> Server)
    // ==========================================
    
    /**
     * Location update from helper
     * Client -> Server: { taskId, latitude, longitude, accuracy, heading, speed }
     */
    socket.on('location:update', async (data) => {
      try {
        // Rate limiting
        try {
          await locationRateLimiter.consume(socket.userId);
        } catch (rejRes) {
          logger.warn(`Location update rate limited for user ${socket.userId}`);
          return socket.emit('error', { message: 'Rate limit exceeded. Try again later.' });
        }

        const { taskId, latitude, longitude, accuracy, heading, speed } = data;
        
        // Validate required fields
        if (!taskId || latitude === undefined || longitude === undefined) {
          return socket.emit('error', { message: 'Task ID, latitude, and longitude required' });
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          return socket.emit('error', { message: 'Invalid coordinates' });
        }

        // Only helpers can send location updates
        if (socket.userRole !== 'HELPER') {
          return socket.emit('error', { message: 'Only helpers can send location updates' });
        }

        // Store location in Redis
        const redis = getRedisClient();
        const locationKey = `location:${taskId}:${socket.userId}`;
        const locationData = {
          userId: socket.userId,
          helperId: socket.helperId,
          taskId,
          latitude,
          longitude,
          accuracy: accuracy || 0,
          heading: heading || null,
          speed: speed || null,
          timestamp: new Date().toISOString()
        };

        await redis.setex(locationKey, 3600, JSON.stringify(locationData)); // 1 hour TTL
        
        // Add to geospatial index for the task
        await redis.geoadd(`task:${taskId}:locations`, longitude, latitude, socket.userId);

        // Publish to Redis for other services
        await redis.publish('location:updates', JSON.stringify(locationData));

        logger.debug(`Location update from helper ${socket.userId} for task ${taskId}`);
        
        // Acknowledge receipt
        socket.emit('location:received', { 
          taskId, 
          timestamp: locationData.timestamp 
        });
      } catch (error) {
        logger.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to process location update' });
      }
    });

    // ==========================================
    // Task Events (Helper -> Server)
    // ==========================================
    
    /**
     * Helper accepts task
     * Client -> Server: { taskId }
     */
    socket.on('task:accept', async (data) => {
      try {
        const { taskId } = data;
        
        if (!taskId) {
          return socket.emit('error', { message: 'Task ID required' });
        }

        if (socket.userRole !== 'HELPER') {
          return socket.emit('error', { message: 'Only helpers can accept tasks' });
        }

        logger.info(`Helper ${socket.userId} accepted task ${taskId}`);
        
        // Publish to RabbitMQ for processing by task service
        const { getChannel } = require('./rabbitmq');
        const channel = getChannel();
        
        const event = {
          type: 'TASK_ACCEPTED',
          taskId,
          helperId: socket.helperId,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        };
        
        channel.publish(
          'task.events',
          'task.accepted',
          Buffer.from(JSON.stringify(event)),
          { persistent: true }
        );

        socket.emit('task:accept_sent', { taskId });
      } catch (error) {
        logger.error('Task accept error:', error);
        socket.emit('error', { message: 'Failed to accept task' });
      }
    });

    /**
     * Helper declines task
     * Client -> Server: { taskId, reason }
     */
    socket.on('task:decline', async (data) => {
      try {
        const { taskId, reason } = data;
        
        if (!taskId) {
          return socket.emit('error', { message: 'Task ID required' });
        }

        if (socket.userRole !== 'HELPER') {
          return socket.emit('error', { message: 'Only helpers can decline tasks' });
        }

        logger.info(`Helper ${socket.userId} declined task ${taskId}`);
        
        const { getChannel } = require('./rabbitmq');
        const channel = getChannel();
        
        const event = {
          type: 'TASK_DECLINED',
          taskId,
          helperId: socket.helperId,
          userId: socket.userId,
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString()
        };
        
        channel.publish(
          'task.events',
          'task.declined',
          Buffer.from(JSON.stringify(event)),
          { persistent: true }
        );

        socket.emit('task:decline_sent', { taskId });
      } catch (error) {
        logger.error('Task decline error:', error);
        socket.emit('error', { message: 'Failed to decline task' });
      }
    });

    /**
     * Helper starts task
     * Client -> Server: { taskId }
     */
    socket.on('task:start', async (data) => {
      try {
        const { taskId } = data;
        
        if (!taskId) {
          return socket.emit('error', { message: 'Task ID required' });
        }

        if (socket.userRole !== 'HELPER') {
          return socket.emit('error', { message: 'Only helpers can start tasks' });
        }

        logger.info(`Helper ${socket.userId} started task ${taskId}`);
        
        const { getChannel } = require('./rabbitmq');
        const channel = getChannel();
        
        const event = {
          type: 'TASK_STARTED',
          taskId,
          helperId: socket.helperId,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        };
        
        channel.publish(
          'task.events',
          'task.started',
          Buffer.from(JSON.stringify(event)),
          { persistent: true }
        );

        socket.emit('task:start_sent', { taskId });
      } catch (error) {
        logger.error('Task start error:', error);
        socket.emit('error', { message: 'Failed to start task' });
      }
    });

    /**
     * Helper completes task
     * Client -> Server: { taskId, notes }
     */
    socket.on('task:complete', async (data) => {
      try {
        const { taskId, notes } = data;
        
        if (!taskId) {
          return socket.emit('error', { message: 'Task ID required' });
        }

        if (socket.userRole !== 'HELPER') {
          return socket.emit('error', { message: 'Only helpers can complete tasks' });
        }

        logger.info(`Helper ${socket.userId} completed task ${taskId}`);
        
        const { getChannel } = require('./rabbitmq');
        const channel = getChannel();
        
        const event = {
          type: 'TASK_COMPLETED',
          taskId,
          helperId: socket.helperId,
          userId: socket.userId,
          notes: notes || '',
          timestamp: new Date().toISOString()
        };
        
        channel.publish(
          'task.events',
          'task.completed',
          Buffer.from(JSON.stringify(event)),
          { persistent: true }
        );

        socket.emit('task:complete_sent', { taskId });
      } catch (error) {
        logger.error('Task complete error:', error);
        socket.emit('error', { message: 'Failed to complete task' });
      }
    });

    /**
     * Helper arrived at location
     * Client -> Server: { taskId }
     */
    socket.on('task:arrived', async (data) => {
      try {
        const { taskId } = data;
        
        if (!taskId) {
          return socket.emit('error', { message: 'Task ID required' });
        }

        if (socket.userRole !== 'HELPER') {
          return socket.emit('error', { message: 'Only helpers can mark arrival' });
        }

        logger.info(`Helper ${socket.userId} arrived at task ${taskId}`);
        
        // Broadcast to task room
        io.to(`task:${taskId}`).emit('helper:arrived', {
          taskId,
          helperId: socket.helperId,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });

        socket.emit('task:arrived_sent', { taskId });
      } catch (error) {
        logger.error('Task arrived error:', error);
        socket.emit('error', { message: 'Failed to mark arrival' });
      }
    });

    // ==========================================
    // Chat Events
    // ==========================================
    
    /**
     * Send chat message
     * Client -> Server: { taskId, message, recipientId }
     */
    socket.on('chat:message', async (data) => {
      try {
        const { taskId, message, recipientId } = data;
        
        if (!taskId || !message) {
          return socket.emit('error', { message: 'Task ID and message required' });
        }

        const chatMessage = {
          id: require('uuid').v4(),
          taskId,
          senderId: socket.userId,
          senderRole: socket.userRole,
          recipientId: recipientId || null,
          message: message.trim(),
          timestamp: new Date().toISOString()
        };

        // Broadcast to task room
        io.to(`task:${taskId}`).emit('chat:message', chatMessage);

        // Store in Redis for message history
        const redis = getRedisClient();
        await redis.lpush(`chat:${taskId}`, JSON.stringify(chatMessage));
        await redis.ltrim(`chat:${taskId}`, 0, 199); // Keep last 200 messages
        await redis.expire(`chat:${taskId}`, 86400 * 7); // 7 days TTL

        logger.info(`Chat message in task ${taskId} from user ${socket.userId}`);
      } catch (error) {
        logger.error('Chat message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator
     * Client -> Server: { taskId, isTyping }
     */
    socket.on('chat:typing', (data) => {
      try {
        const { taskId, isTyping } = data;
        
        if (!taskId) return;

        socket.to(`task:${taskId}`).emit('chat:typing', {
          taskId,
          userId: socket.userId,
          role: socket.userRole,
          isTyping: !!isTyping
        });
      } catch (error) {
        logger.error('Chat typing error:', error);
      }
    });

    /**
     * Mark messages as read
     * Client -> Server: { taskId, messageIds }
     */
    socket.on('chat:read', async (data) => {
      try {
        const { taskId, messageIds } = data;
        
        if (!taskId || !messageIds || !Array.isArray(messageIds)) {
          return socket.emit('error', { message: 'Task ID and message IDs required' });
        }

        io.to(`task:${taskId}`).emit('chat:read_receipt', {
          taskId,
          userId: socket.userId,
          messageIds,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Chat read error:', error);
      }
    });

    // ==========================================
    // Heartbeat / Ping-Pong
    // ==========================================
    
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // ==========================================
    // Disconnection Handler
    // ==========================================
    
    socket.on('disconnect', async (reason) => {
      logger.info(`User disconnected: ${socket.userId}, Reason: ${reason}, Socket ID: ${socket.id}`);
      
      await removeConnection(socket);
      await updatePresence(socket.userId, 'offline', socket);
      
      // Notify relevant rooms about disconnection
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('task:')) {
          socket.to(room).emit('task:member_disconnected', {
            taskId: room.replace('task:', ''),
            userId: socket.userId,
            role: socket.userRole,
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });
}

/**
 * Store socket connection in Redis
 */
async function storeConnection(socket) {
  try {
    const redis = getRedisClient();
    const connectionData = {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole,
      helperId: socket.helperId,
      deviceId: socket.deviceId,
      platform: socket.platform,
      connectedAt: new Date().toISOString(),
      ip: socket.handshake.address
    };

    // Store in user's socket set
    await redis.sadd(`user:${socket.userId}:sockets`, socket.id);
    
    // Store connection details
    await redis.setex(
      `socket:${socket.id}`,
      86400, // 24 hours
      JSON.stringify(connectionData)
    );

    // Add to global connections set
    await redis.sadd('connections:active', socket.id);
    
    logger.debug(`Stored connection for user ${socket.userId}, socket ${socket.id}`);
  } catch (error) {
    logger.error('Failed to store connection:', error);
  }
}

/**
 * Remove socket connection from Redis
 */
async function removeConnection(socket) {
  try {
    const redis = getRedisClient();
    
    await redis.srem(`user:${socket.userId}:sockets`, socket.id);
    await redis.del(`socket:${socket.id}`);
    await redis.srem('connections:active', socket.id);
    
    logger.debug(`Removed connection for user ${socket.userId}, socket ${socket.id}`);
  } catch (error) {
    logger.error('Failed to remove connection:', error);
  }
}

/**
 * Update user presence status
 */
async function updatePresence(userId, status, socket) {
  try {
    const redis = getRedisClient();
    
    if (status === 'online') {
      await redis.hset(`presence:${userId}`, {
        status: 'online',
        socketId: socket.id,
        lastSeen: new Date().toISOString()
      });
      await redis.expire(`presence:${userId}`, 86400);
    } else {
      // Check if user has other active connections
      const sockets = await redis.smembers(`user:${userId}:sockets`);
      
      if (sockets.length === 0) {
        await redis.hset(`presence:${userId}`, {
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
        await redis.expire(`presence:${userId}`, 86400);
      }
    }
    
    logger.debug(`Updated presence for user ${userId}: ${status}`);
  } catch (error) {
    logger.error('Failed to update presence:', error);
  }
}

module.exports = {
  setupSocketHandlers,
  socketAuthMiddleware,
  storeConnection,
  removeConnection,
  updatePresence
};
