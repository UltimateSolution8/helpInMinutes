/**
 * Task Event Service
 * Broadcast task events to relevant clients
 */

const logger = require('../config/logger');
const { getChannel } = require('../config/rabbitmq');
const TaskEvent = require('../models/TaskEvent');
const socketService = require('./socketService');
const notificationService = require('./notificationService');

class TaskEventService {
  constructor() {
    this.channel = null;
  }

  /**
   * Initialize with RabbitMQ channel
   */
  initialize() {
    this.channel = getChannel();
    logger.info('TaskEventService initialized');
  }

  /**
   * Handle task assigned event
   */
  async handleTaskAssigned(eventData) {
    try {
      const event = new TaskEvent({
        type: TaskEvent.Types.TASK_ASSIGNED,
        taskId: eventData.taskId,
        helperId: eventData.helperId,
        buyerId: eventData.buyerId,
        data: eventData,
        priority: 'high'
      });

      // Send to helper
      await socketService.sendToHelper(eventData.helperId, 'task:assigned', event.toBroadcastObject());

      // Send alert overlay
      await socketService.sendToHelper(eventData.helperId, 'task:alert', {
        ...event.toBroadcastObject(),
        alertType: 'priority',
        message: 'New task available!'
      });

      // Send push notification if not online
      const isOnline = await socketService.isUserOnline(eventData.helperUserId);
      if (!isOnline) {
        await notificationService.sendTaskAlert(eventData.helperUserId, event);
      }

      // Persist event
      await this.persistEvent(event);

      logger.info(`Task ${eventData.taskId} assigned to helper ${eventData.helperId}`);
    } catch (error) {
      logger.error('Failed to handle task assigned:', error);
    }
  }

  /**
   * Handle task accepted event
   */
  async handleTaskAccepted(eventData) {
    try {
      const event = new TaskEvent({
        type: TaskEvent.Types.TASK_ACCEPTED,
        taskId: eventData.taskId,
        helperId: eventData.helperId,
        buyerId: eventData.buyerId,
        userId: eventData.userId,
        data: eventData
      });

      // Notify buyer
      await socketService.sendToUser(eventData.buyerId, 'task:accepted', event.toBroadcastObject());

      // Add helper to task room
      await this.addHelperToTaskRoom(eventData.taskId, eventData.helperId);

      // Persist event
      await this.persistEvent(event);

      logger.info(`Task ${eventData.taskId} accepted by helper ${eventData.helperId}`);
    } catch (error) {
      logger.error('Failed to handle task accepted:', error);
    }
  }

  /**
   * Handle task started event
   */
  async handleTaskStarted(eventData) {
    try {
      const event = new TaskEvent({
        type: TaskEvent.Types.TASK_STARTED,
        taskId: eventData.taskId,
        helperId: eventData.helperId,
        buyerId: eventData.buyerId,
        data: eventData
      });

      // Broadcast to task room
      socketService.sendToTask(eventData.taskId, 'task:started', event.toBroadcastObject());

      // Persist event
      await this.persistEvent(event);

      logger.info(`Task ${eventData.taskId} started`);
    } catch (error) {
      logger.error('Failed to handle task started:', error);
    }
  }

  /**
   * Handle task completed event
   */
  async handleTaskCompleted(eventData) {
    try {
      const event = new TaskEvent({
        type: TaskEvent.Types.TASK_COMPLETED,
        taskId: eventData.taskId,
        helperId: eventData.helperId,
        buyerId: eventData.buyerId,
        data: eventData
      });

      // Broadcast to task room
      socketService.sendToTask(eventData.taskId, 'task:completed', event.toBroadcastObject());

      // Persist event
      await this.persistEvent(event);

      logger.info(`Task ${eventData.taskId} completed`);
    } catch (error) {
      logger.error('Failed to handle task completed:', error);
    }
  }

  /**
   * Handle task cancelled event
   */
  async handleTaskCancelled(eventData) {
    try {
      const event = new TaskEvent({
        type: TaskEvent.Types.TASK_CANCELLED,
        taskId: eventData.taskId,
        helperId: eventData.helperId,
        buyerId: eventData.buyerId,
        userId: eventData.cancelledBy,
        data: eventData,
        priority: 'high'
      });

      // Broadcast to task room
      socketService.sendToTask(eventData.taskId, 'task:cancelled', event.toBroadcastObject());

      // Send push notification
      if (eventData.cancelledBy === eventData.buyerId) {
        await notificationService.sendToHelper(eventData.helperId, {
          title: 'Task Cancelled',
          body: `Task #${eventData.taskId} has been cancelled by the buyer`
        });
      } else {
        await notificationService.sendToUser(eventData.buyerId, {
          title: 'Task Cancelled',
          body: `Task #${eventData.taskId} has been cancelled by the helper`
        });
      }

      // Persist event
      await this.persistEvent(event);

      logger.info(`Task ${eventData.taskId} cancelled`);
    } catch (error) {
      logger.error('Failed to handle task cancelled:', error);
    }
  }

  /**
   * Handle payment completed event
   */
  async handlePaymentCompleted(eventData) {
    try {
      const event = new TaskEvent({
        type: TaskEvent.Types.PAYMENT_COMPLETED,
        taskId: eventData.taskId,
        buyerId: eventData.buyerId,
        helperId: eventData.helperId,
        data: eventData,
        priority: 'high'
      });

      // Notify buyer
      await socketService.sendToUser(eventData.buyerId, 'payment:completed', event.toBroadcastObject());

      // Notify helper
      if (eventData.helperId) {
        await socketService.sendToHelper(eventData.helperId, 'payment:completed', event.toBroadcastObject());
      }

      // Send push notification
      await notificationService.sendToUser(eventData.buyerId, {
        title: 'Payment Confirmed',
        body: `Payment of $${eventData.amount} has been processed`
      });

      // Persist event
      await this.persistEvent(event);

      logger.info(`Payment completed for task ${eventData.taskId}`);
    } catch (error) {
      logger.error('Failed to handle payment completed:', error);
    }
  }

  /**
   * Broadcast helper location update
   */
  async broadcastHelperLocation(taskId, buyerId, locationData) {
    try {
      await socketService.sendToUser(buyerId, 'helper:location', locationData);
    } catch (error) {
      logger.error('Failed to broadcast helper location:', error);
    }
  }

  /**
   * Broadcast generic task event
   */
  broadcastTaskEvent(taskId, eventType, data) {
    try {
      socketService.sendToTask(taskId, eventType, {
        taskId,
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to broadcast task event:', error);
    }
  }

  /**
   * Add helper to task room
   */
  async addHelperToTaskRoom(taskId, helperId) {
    try {
      const { getRedisClient } = require('../config/redis');
      const redis = getRedisClient();
      
      // Store helper-task mapping
      await redis.setex(`helper:${helperId}:current_task`, 86400, taskId);
      await redis.sadd(`task:${taskId}:helpers`, helperId);
      
      logger.debug(`Helper ${helperId} added to task room ${taskId}`);
    } catch (error) {
      logger.error('Failed to add helper to task room:', error);
    }
  }

  /**
   * Remove helper from task room
   */
  async removeHelperFromTaskRoom(taskId, helperId) {
    try {
      const { getRedisClient } = require('../config/redis');
      const redis = getRedisClient();
      
      await redis.del(`helper:${helperId}:current_task`);
      await redis.srem(`task:${taskId}:helpers`, helperId);
      
      logger.debug(`Helper ${helperId} removed from task room ${taskId}`);
    } catch (error) {
      logger.error('Failed to remove helper from task room:', error);
    }
  }

  /**
   * Persist event to Redis
   */
  async persistEvent(event) {
    try {
      const { getRedisClient } = require('../config/redis');
      const redis = getRedisClient();
      
      // Add to task events list
      await redis.lpush(event.getTaskEventsKey(), event.toRedisString());
      await redis.ltrim(event.getTaskEventsKey(), 0, 99); // Keep last 100 events
      await redis.expire(event.getTaskEventsKey(), 86400 * 7); // 7 days

      // Add to user events list if applicable
      if (event.userId) {
        await redis.lpush(event.getUserEventsKey(), event.toRedisString());
        await redis.ltrim(event.getUserEventsKey(), 0, 99);
        await redis.expire(event.getUserEventsKey(), 86400 * 7);
      }
    } catch (error) {
      logger.error('Failed to persist event:', error);
    }
  }

  /**
   * Get task events
   */
  async getTaskEvents(taskId, limit = 50) {
    try {
      const { getRedisClient } = require('../config/redis');
      const redis = getRedisClient();
      
      const events = await redis.lrange(`task:${taskId}:events`, 0, limit - 1);
      return events.map(e => TaskEvent.fromRedisString(e));
    } catch (error) {
      logger.error('Failed to get task events:', error);
      return [];
    }
  }

  /**
   * Publish event to RabbitMQ
   */
  async publishEvent(event) {
    try {
      this.channel.publish(
        'task.events',
        event.getRoutingKey(),
        event.toRabbitMQMessage(),
        { persistent: true }
      );
    } catch (error) {
      logger.error('Failed to publish event:', error);
    }
  }
}

// Export singleton instance
module.exports = new TaskEventService();
