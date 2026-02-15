/**
 * Event Handlers
 * Handle events from RabbitMQ
 */

const logger = require('../config/logger');
const taskEventService = require('../services/taskEventService');
const locationService = require('../services/locationService');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');
const TaskEvent = require('../models/TaskEvent');

/**
 * Handle TaskAssignedEvent from matching service
 */
async function handleTaskAssignedEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.info('Received TaskAssignedEvent:', eventData.taskId);

    await taskEventService.handleTaskAssigned({
      taskId: eventData.taskId,
      helperId: eventData.helperId,
      buyerId: eventData.buyerId,
      helperUserId: eventData.helperUserId,
      taskDetails: eventData.taskDetails
    });

    return true;
  } catch (error) {
    logger.error('Error handling TaskAssignedEvent:', error);
    return false;
  }
}

/**
 * Handle TaskStatusChangedEvent from task service
 */
async function handleTaskStatusChangedEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.info('Received TaskStatusChangedEvent:', eventData.taskId, eventData.status);

    const { taskId, status, helperId, buyerId, ...additionalData } = eventData;

    switch (status) {
      case 'ACCEPTED':
        await taskEventService.handleTaskAccepted({
          taskId,
          helperId,
          buyerId,
          ...additionalData
        });
        break;

      case 'IN_PROGRESS':
        await taskEventService.handleTaskStarted({
          taskId,
          helperId,
          buyerId,
          ...additionalData
        });
        break;

      case 'COMPLETED':
        await taskEventService.handleTaskCompleted({
          taskId,
          helperId,
          buyerId,
          ...additionalData
        });
        break;

      case 'CANCELLED':
        await taskEventService.handleTaskCancelled({
          taskId,
          helperId,
          buyerId,
          cancelledBy: additionalData.cancelledBy,
          ...additionalData
        });
        break;

      default:
        // Broadcast generic status change
        socketService.sendToTask(taskId, 'status:changed', {
          taskId,
          status,
          timestamp: new Date().toISOString(),
          ...additionalData
        });
    }

    return true;
  } catch (error) {
    logger.error('Error handling TaskStatusChangedEvent:', error);
    return false;
  }
}

/**
 * Handle HelperLocationUpdateEvent from matching service
 */
async function handleHelperLocationUpdateEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.debug('Received HelperLocationUpdateEvent:', eventData.taskId);

    // Process and broadcast location update
    await locationService.processLocationUpdate({
      userId: eventData.userId,
      helperId: eventData.helperId,
      taskId: eventData.taskId,
      latitude: eventData.latitude,
      longitude: eventData.longitude,
      accuracy: eventData.accuracy,
      heading: eventData.heading,
      speed: eventData.speed,
      timestamp: eventData.timestamp
    });

    return true;
  } catch (error) {
    logger.error('Error handling HelperLocationUpdateEvent:', error);
    return false;
  }
}

/**
 * Handle PaymentCompletedEvent from payment service
 */
async function handlePaymentCompletedEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.info('Received PaymentCompletedEvent:', eventData.taskId);

    await taskEventService.handlePaymentCompleted({
      taskId: eventData.taskId,
      helperId: eventData.helperId,
      buyerId: eventData.buyerId,
      amount: eventData.amount,
      paymentId: eventData.paymentId,
      ...eventData
    });

    return true;
  } catch (error) {
    logger.error('Error handling PaymentCompletedEvent:', error);
    return false;
  }
}

/**
 * Handle PaymentFailedEvent from payment service
 */
async function handlePaymentFailedEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.warn('Received PaymentFailedEvent:', eventData.taskId);

    const { taskId, buyerId, helperId, reason } = eventData;

    // Notify buyer about payment failure
    await socketService.sendToUser(buyerId, 'payment:failed', {
      taskId,
      reason: reason || 'Payment processing failed',
      timestamp: new Date().toISOString()
    });

    // Send push notification
    await notificationService.sendToUser(buyerId, {
      title: 'Payment Failed',
      body: reason || 'Your payment could not be processed. Please try again.',
      data: {
        type: 'PAYMENT_FAILED',
        taskId
      },
      priority: 'high'
    });

    return true;
  } catch (error) {
    logger.error('Error handling PaymentFailedEvent:', error);
    return false;
  }
}

/**
 * Handle MatchFailedEvent from matching service
 */
async function handleMatchFailedEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.warn('Received MatchFailedEvent:', eventData.taskId);

    const { taskId, buyerId, reason } = eventData;

    // Notify buyer about match failure
    await socketService.sendToUser(buyerId, 'task:match_failed', {
      taskId,
      reason: reason || 'No helpers available at this time',
      timestamp: new Date().toISOString()
    });

    // Send push notification
    await notificationService.sendToUser(buyerId, {
      title: 'No Helpers Available',
      body: 'We couldn\'t find any available helpers for your task. Please try again later.',
      data: {
        type: 'MATCH_FAILED',
        taskId
      }
    });

    return true;
  } catch (error) {
    logger.error('Error handling MatchFailedEvent:', error);
    return false;
  }
}

/**
 * Handle HelperDeclinedEvent from matching service
 */
async function handleHelperDeclinedEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.info('Received HelperDeclinedEvent:', eventData.taskId);

    const { taskId, helperId, reason } = eventData;

    // Broadcast to task room if exists
    socketService.sendToTask(taskId, 'helper:declined', {
      taskId,
      helperId,
      reason: reason || 'Helper declined the task',
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    logger.error('Error handling HelperDeclinedEvent:', error);
    return false;
  }
}

/**
 * Handle TaskExpiredEvent from task service
 */
async function handleTaskExpiredEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.info('Received TaskExpiredEvent:', eventData.taskId);

    const { taskId, buyerId } = eventData;

    // Notify buyer
    await socketService.sendToUser(buyerId, 'task:expired', {
      taskId,
      reason: 'Task expired without being assigned',
      timestamp: new Date().toISOString()
    });

    // Send push notification
    await notificationService.sendToUser(buyerId, {
      title: 'Task Expired',
      body: 'Your task has expired. Please create a new task if you still need help.',
      data: {
        type: 'TASK_EXPIRED',
        taskId
      }
    });

    return true;
  } catch (error) {
    logger.error('Error handling TaskExpiredEvent:', error);
    return false;
  }
}

/**
 * Handle generic broadcast event
 */
async function handleBroadcastEvent(message) {
  try {
    const eventData = JSON.parse(message.content.toString());
    logger.info('Received BroadcastEvent:', eventData.event);

    const { event, target, targetId, data } = eventData;

    switch (target) {
      case 'user':
        await socketService.sendToUser(targetId, event, data);
        break;
      case 'helper':
        await socketService.sendToHelper(targetId, event, data);
        break;
      case 'task':
        socketService.sendToTask(targetId, event, data);
        break;
      case 'role':
        if (targetId === 'HELPER') {
          socketService.sendToHelpers(event, data);
        } else if (targetId === 'BUYER') {
          socketService.sendToBuyers(event, data);
        }
        break;
      case 'all':
        socketService.broadcast(event, data);
        break;
      default:
        logger.warn('Unknown broadcast target:', target);
    }

    return true;
  } catch (error) {
    logger.error('Error handling BroadcastEvent:', error);
    return false;
  }
}

module.exports = {
  handleTaskAssignedEvent,
  handleTaskStatusChangedEvent,
  handleHelperLocationUpdateEvent,
  handlePaymentCompletedEvent,
  handlePaymentFailedEvent,
  handleMatchFailedEvent,
  handleHelperDeclinedEvent,
  handleTaskExpiredEvent,
  handleBroadcastEvent
};
