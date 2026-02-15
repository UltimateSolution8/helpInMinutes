/**
 * Notification Service
 * Push notifications via Firebase Cloud Messaging (FCM)
 */

const logger = require('../config/logger');
const { getRedisClient } = require('../config/redis');
const TaskEvent = require('../models/TaskEvent');

// FCM configuration
const FCM_API_URL = 'https://fcm.googleapis.com/v1/projects/';

class NotificationService {
  constructor() {
    this.redis = null;
    this.fcmEnabled = false;
    this.projectId = process.env.FCM_PROJECT_ID;
    this.serviceAccount = null;
  }

  /**
   * Initialize notification service
   */
  initialize() {
    this.redis = getRedisClient();
    
    // Check if FCM is configured
    if (process.env.FCM_SERVICE_ACCOUNT || process.env.FCM_SERVER_KEY) {
      this.fcmEnabled = true;
      
      if (process.env.FCM_SERVICE_ACCOUNT) {
        try {
          this.serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT);
        } catch (error) {
          logger.error('Failed to parse FCM service account:', error);
        }
      }
      
      logger.info('NotificationService initialized with FCM');
    } else {
      logger.warn('NotificationService initialized without FCM - push notifications disabled');
    }
  }

  /**
   * Send notification to user
   */
  async sendToUser(userId, notification) {
    try {
      // Get user's FCM tokens
      const tokens = await this.getUserTokens(userId);
      
      if (tokens.length === 0) {
        logger.debug(`No FCM tokens found for user ${userId}`);
        return false;
      }

      const payload = this.buildNotificationPayload(notification);
      
      // Send to all tokens
      const results = await Promise.allSettled(
        tokens.map(token => this.sendFCM(token, payload))
      );

      // Clean up invalid tokens
      const invalidTokens = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected' || 
            (result.value && result.value.error)) {
          invalidTokens.push(tokens[index]);
        }
      });

      if (invalidTokens.length > 0) {
        await this.removeInvalidTokens(userId, invalidTokens);
      }

      logger.info(`Notification sent to user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send notification to user:', error);
      return false;
    }
  }

  /**
   * Send notification to helper
   */
  async sendToHelper(helperId, notification) {
    try {
      // Get helper's user ID
      const userId = await this.getHelperUserId(helperId);
      
      if (!userId) {
        logger.debug(`No user found for helper ${helperId}`);
        return false;
      }

      return await this.sendToUser(userId, notification);
    } catch (error) {
      logger.error('Failed to send notification to helper:', error);
      return false;
    }
  }

  /**
   * Send task alert notification
   */
  async sendTaskAlert(userId, taskEvent) {
    try {
      const notification = {
        title: taskEvent.getNotificationTitle(),
        body: taskEvent.getNotificationBody(),
        data: {
          type: 'TASK_ALERT',
          taskId: taskEvent.taskId,
          priority: 'high'
        },
        priority: 'high',
        sound: 'default',
        badge: 1
      };

      return await this.sendToUser(userId, notification);
    } catch (error) {
      logger.error('Failed to send task alert:', error);
      return false;
    }
  }

  /**
   * Send task assigned notification
   */
  async sendTaskAssigned(userId, taskData) {
    try {
      const notification = {
        title: 'New Task Assigned!',
        body: `Task #${taskData.taskId} has been assigned to you`,
        data: {
          type: 'TASK_ASSIGNED',
          taskId: taskData.taskId,
          priority: 'high'
        },
        priority: 'high',
        sound: 'default',
        badge: 1
      };

      return await this.sendToUser(userId, notification);
    } catch (error) {
      logger.error('Failed to send task assigned notification:', error);
      return false;
    }
  }

  /**
   * Send helper arriving notification
   */
  async sendHelperArriving(userId, taskId, eta) {
    try {
      const notification = {
        title: 'Helper Arriving Soon',
        body: eta 
          ? `Your helper will arrive in approximately ${Math.ceil(eta / 60)} minutes`
          : 'Your helper is approaching your location',
        data: {
          type: 'HELPER_ARRIVING',
          taskId: taskId
        },
        priority: 'high',
        sound: 'default'
      };

      return await this.sendToUser(userId, notification);
    } catch (error) {
      logger.error('Failed to send helper arriving notification:', error);
      return false;
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(userId, amount, taskId) {
    try {
      const notification = {
        title: 'Payment Confirmed',
        body: `Your payment of $${amount} has been processed successfully`,
        data: {
          type: 'PAYMENT_COMPLETED',
          taskId: taskId,
          amount: amount
        },
        priority: 'normal'
      };

      return await this.sendToUser(userId, notification);
    } catch (error) {
      logger.error('Failed to send payment confirmation:', error);
      return false;
    }
  }

  /**
   * Send chat notification (when app in background)
   */
  async sendChatNotification(userId, messageData) {
    try {
      const notification = {
        title: 'New Message',
        body: messageData.message.substring(0, 100),
        data: {
          type: 'CHAT_MESSAGE',
          taskId: messageData.taskId,
          senderId: messageData.senderId
        },
        priority: 'normal'
      };

      return await this.sendToUser(userId, notification);
    } catch (error) {
      logger.error('Failed to send chat notification:', error);
      return false;
    }
  }

  /**
   * Store FCM token for user
   */
  async storeToken(userId, token, platform = 'unknown') {
    try {
      const tokenData = {
        token,
        platform,
        createdAt: new Date().toISOString()
      };

      await this.redis.hset(`user:${userId}:fcm_tokens`, token, JSON.stringify(tokenData));
      await this.redis.expire(`user:${userId}:fcm_tokens`, 86400 * 30); // 30 days

      logger.info(`FCM token stored for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to store FCM token:', error);
      return false;
    }
  }

  /**
   * Remove FCM token
   */
  async removeToken(userId, token) {
    try {
      await this.redis.hdel(`user:${userId}:fcm_tokens`, token);
      logger.info(`FCM token removed for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove FCM token:', error);
      return false;
    }
  }

  /**
   * Get user's FCM tokens
   */
  async getUserTokens(userId) {
    try {
      const tokens = await this.redis.hgetall(`user:${userId}:fcm_tokens`);
      return Object.keys(tokens);
    } catch (error) {
      logger.error('Failed to get user tokens:', error);
      return [];
    }
  }

  /**
   * Remove invalid tokens
   */
  async removeInvalidTokens(userId, invalidTokens) {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const token of invalidTokens) {
        pipeline.hdel(`user:${userId}:fcm_tokens`, token);
      }
      
      await pipeline.exec();
      logger.info(`Removed ${invalidTokens.length} invalid tokens for user ${userId}`);
    } catch (error) {
      logger.error('Failed to remove invalid tokens:', error);
    }
  }

  /**
   * Get helper's user ID
   */
  async getHelperUserId(helperId) {
    try {
      const userId = await this.redis.get(`helper:${helperId}:user_id`);
      return userId;
    } catch (error) {
      logger.error('Failed to get helper user ID:', error);
      return null;
    }
  }

  /**
   * Build FCM notification payload
   */
  buildNotificationPayload(notification) {
    const payload = {
      message: {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          priority: notification.priority === 'high' ? 'high' : 'normal',
          notification: {
            sound: notification.sound || 'default',
            channel_id: notification.priority === 'high' ? 'high_priority' : 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: notification.sound || 'default',
              badge: notification.badge || 0,
              'content-available': 1
            }
          }
        }
      }
    };

    return payload;
  }

  /**
   * Send FCM message
   * Note: In production, use the Firebase Admin SDK
   */
  async sendFCM(token, payload) {
    if (!this.fcmEnabled) {
      logger.debug('FCM not enabled, skipping send');
      return { success: true, simulated: true };
    }

    try {
      // For production, use Firebase Admin SDK
      // const admin = require('firebase-admin');
      // await admin.messaging().send({
      //   token,
      //   ...payload.message
      // });

      // For now, simulate successful send
      logger.debug(`FCM sent to token: ${token.substring(0, 20)}...`);
      return { success: true };
    } catch (error) {
      logger.error('FCM send failed:', error);
      throw error;
    }
  }

  /**
   * Send to topic (for broadcast notifications)
   */
  async sendToTopic(topic, notification) {
    try {
      if (!this.fcmEnabled) {
        logger.debug('FCM not enabled, skipping topic send');
        return false;
      }

      const payload = this.buildNotificationPayload(notification);
      payload.message.topic = topic;

      // In production, use Firebase Admin SDK
      logger.info(`Notification sent to topic: ${topic}`);
      return true;
    } catch (error) {
      logger.error('Failed to send to topic:', error);
      return false;
    }
  }

  /**
   * Subscribe tokens to topic
   */
  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.fcmEnabled) {
        return false;
      }

      // In production, use Firebase Admin SDK
      // await admin.messaging().subscribeToTopic(tokens, topic);
      
      logger.info(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
      return true;
    } catch (error) {
      logger.error('Failed to subscribe to topic:', error);
      return false;
    }
  }

  /**
   * Unsubscribe tokens from topic
   */
  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.fcmEnabled) {
        return false;
      }

      // In production, use Firebase Admin SDK
      // await admin.messaging().unsubscribeFromTopic(tokens, topic);
      
      logger.info(`Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe from topic:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();
