/**
 * Presence Service
 * Track online/offline status of users and helpers
 */

const logger = require('../config/logger');
const { getRedisClient } = require('../config/redis');
const socketService = require('./socketService');

class PresenceService {
  constructor() {
    this.redis = null;
    this.heartbeatInterval = 30000; // 30 seconds
    this.offlineTimeout = 60000; // 60 seconds
  }

  /**
   * Initialize presence service
   */
  initialize() {
    this.redis = getRedisClient();
    this.startHeartbeatMonitor();
    logger.info('PresenceService initialized');
  }

  /**
   * Set user as online
   */
  async setOnline(userId, socketId, metadata = {}) {
    try {
      const presenceData = {
        userId,
        socketId,
        status: 'online',
        lastSeen: new Date().toISOString(),
        ...metadata
      };

      // Store presence data
      await this.redis.hset(`presence:${userId}`, presenceData);
      await this.redis.expire(`presence:${userId}`, 86400); // 24 hours

      // Add to online users set
      await this.redis.sadd('users:online', userId);

      // Add to role-specific set if role provided
      if (metadata.role) {
        await this.redis.sadd(`users:online:${metadata.role}`, userId);
      }

      // Publish presence change
      await this.redis.publish('presence:changes', JSON.stringify({
        userId,
        status: 'online',
        timestamp: presenceData.lastSeen
      }));

      logger.debug(`User ${userId} is now online`);
      return true;
    } catch (error) {
      logger.error('Failed to set user online:', error);
      return false;
    }
  }

  /**
   * Set user as offline
   */
  async setOffline(userId, socketId) {
    try {
      // Check if user has other active connections
      const userSockets = await socketService.getUserSockets(userId);
      
      if (userSockets.length === 0 || (userSockets.length === 1 && userSockets[0] === socketId)) {
        // No other connections, mark as offline
        const presenceData = {
          status: 'offline',
          lastSeen: new Date().toISOString()
        };

        await this.redis.hset(`presence:${userId}`, presenceData);
        await this.redis.srem('users:online', userId);

        // Get user's role and remove from role-specific set
        const existingData = await this.redis.hgetall(`presence:${userId}`);
        if (existingData.role) {
          await this.redis.srem(`users:online:${existingData.role}`, userId);
        }

        // Publish presence change
        await this.redis.publish('presence:changes', JSON.stringify({
          userId,
          status: 'offline',
          timestamp: presenceData.lastSeen
        }));

        logger.debug(`User ${userId} is now offline`);
      } else {
        // Still has other connections, just update last seen
        await this.redis.hset(`presence:${userId}`, {
          lastSeen: new Date().toISOString()
        });
      }

      return true;
    } catch (error) {
      logger.error('Failed to set user offline:', error);
      return false;
    }
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(userId) {
    try {
      await this.redis.hset(`presence:${userId}`, {
        lastSeen: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update last seen:', error);
    }
  }

  /**
   * Get user's presence status
   */
  async getPresence(userId) {
    try {
      const data = await this.redis.hgetall(`presence:${userId}`);
      
      if (!data || Object.keys(data).length === 0) {
        return {
          userId,
          status: 'offline',
          lastSeen: null
        };
      }

      return {
        userId,
        status: data.status || 'offline',
        lastSeen: data.lastSeen,
        socketId: data.socketId
      };
    } catch (error) {
      logger.error('Failed to get presence:', error);
      return {
        userId,
        status: 'unknown',
        lastSeen: null
      };
    }
  }

  /**
   * Check if user is online
   */
  async isOnline(userId) {
    try {
      const isMember = await this.redis.sismember('users:online', userId);
      return isMember === 1;
    } catch (error) {
      logger.error('Failed to check online status:', error);
      return false;
    }
  }

  /**
   * Get all online users
   */
  async getOnlineUsers() {
    try {
      return await this.redis.smembers('users:online');
    } catch (error) {
      logger.error('Failed to get online users:', error);
      return [];
    }
  }

  /**
   * Get online users count
   */
  async getOnlineCount() {
    try {
      return await this.redis.scard('users:online');
    } catch (error) {
      logger.error('Failed to get online count:', error);
      return 0;
    }
  }

  /**
   * Get online helpers
   */
  async getOnlineHelpers() {
    try {
      return await this.redis.smembers('users:online:HELPER');
    } catch (error) {
      logger.error('Failed to get online helpers:', error);
      return [];
    }
  }

  /**
   * Get online buyers
   */
  async getOnlineBuyers() {
    try {
      return await this.redis.smembers('users:online:BUYER');
    } catch (error) {
      logger.error('Failed to get online buyers:', error);
      return [];
    }
  }

  /**
   * Get presence for multiple users
   */
  async getBulkPresence(userIds) {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const userId of userIds) {
        pipeline.hgetall(`presence:${userId}`);
      }

      const results = await pipeline.exec();
      
      return userIds.map((userId, index) => {
        const data = results[index][1];
        return {
          userId,
          status: data?.status || 'offline',
          lastSeen: data?.lastSeen || null
        };
      });
    } catch (error) {
      logger.error('Failed to get bulk presence:', error);
      return userIds.map(userId => ({
        userId,
        status: 'unknown',
        lastSeen: null
      }));
    }
  }

  /**
   * Subscribe to presence changes for a user
   */
  async subscribeToPresence(userId, callback) {
    try {
      const subscriber = this.redis.duplicate();
      await subscriber.subscribe('presence:changes');
      
      subscriber.on('message', (channel, message) => {
        const data = JSON.parse(message);
        if (data.userId === userId) {
          callback(data);
        }
      });

      return subscriber;
    } catch (error) {
      logger.error('Failed to subscribe to presence:', error);
      return null;
    }
  }

  /**
   * Start heartbeat monitor
   */
  startHeartbeatMonitor() {
    setInterval(async () => {
      try {
        await this.checkStaleConnections();
      } catch (error) {
        logger.error('Error in heartbeat monitor:', error);
      }
    }, this.heartbeatInterval);
  }

  /**
   * Check for stale connections and mark offline
   */
  async checkStaleConnections() {
    try {
      const onlineUsers = await this.getOnlineUsers();
      const now = new Date();

      for (const userId of onlineUsers) {
        const presence = await this.getPresence(userId);
        
        if (presence.lastSeen) {
          const lastSeen = new Date(presence.lastSeen);
          const timeDiff = now - lastSeen;

          if (timeDiff > this.offlineTimeout) {
            // Check if user still has active sockets
            const sockets = await socketService.getUserSockets(userId);
            
            if (sockets.length === 0) {
              await this.setOffline(userId, presence.socketId);
              logger.info(`Marked user ${userId} as offline due to stale connection`);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check stale connections:', error);
    }
  }

  /**
   * Get presence statistics
   */
  async getStats() {
    try {
      const [totalOnline, helpersOnline, buyersOnline] = await Promise.all([
        this.getOnlineCount(),
        this.redis.scard('users:online:HELPER'),
        this.redis.scard('users:online:BUYER')
      ]);

      return {
        totalOnline,
        helpersOnline,
        buyersOnline,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get presence stats:', error);
      return {
        totalOnline: 0,
        helpersOnline: 0,
        buyersOnline: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Set user activity status (available, busy, away)
   */
  async setActivityStatus(userId, status) {
    try {
      const validStatuses = ['available', 'busy', 'away', 'in_task'];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      await this.redis.hset(`presence:${userId}`, {
        activityStatus: status,
        statusUpdatedAt: new Date().toISOString()
      });

      // Publish activity change
      await this.redis.publish('presence:activity', JSON.stringify({
        userId,
        activityStatus: status,
        timestamp: new Date().toISOString()
      }));

      logger.debug(`User ${userId} activity status set to ${status}`);
      return true;
    } catch (error) {
      logger.error('Failed to set activity status:', error);
      return false;
    }
  }

  /**
   * Get user's activity status
   */
  async getActivityStatus(userId) {
    try {
      const data = await this.redis.hgetall(`presence:${userId}`);
      return {
        userId,
        activityStatus: data?.activityStatus || 'unknown',
        statusUpdatedAt: data?.statusUpdatedAt || null
      };
    } catch (error) {
      logger.error('Failed to get activity status:', error);
      return {
        userId,
        activityStatus: 'unknown',
        statusUpdatedAt: null
      };
    }
  }
}

// Export singleton instance
module.exports = new PresenceService();
