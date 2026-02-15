/**
 * Notification Controller
 * HTTP endpoints for push notification operations
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');

/**
 * Register FCM token for a user
 * POST /api/notifications/token
 */
router.post('/token', async (req, res) => {
  try {
    const { userId, token, platform } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'User ID and token are required'
      });
    }

    const result = await notificationService.storeToken(userId, token, platform);

    if (result) {
      res.json({
        success: true,
        message: 'Token registered successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to register token'
      });
    }
  } catch (error) {
    logger.error('Error registering token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register token'
    });
  }
});

/**
 * Unregister FCM token
 * DELETE /api/notifications/token
 */
router.delete('/token', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'User ID and token are required'
      });
    }

    const result = await notificationService.removeToken(userId, token);

    if (result) {
      res.json({
        success: true,
        message: 'Token unregistered successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to unregister token'
      });
    }
  } catch (error) {
    logger.error('Error unregistering token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister token'
    });
  }
});

/**
 * Send notification to a user
 * POST /api/notifications/send
 */
router.post('/send', async (req, res) => {
  try {
    const { userId, title, body, data, priority } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and body are required'
      });
    }

    const notification = {
      title,
      body,
      data: data || {},
      priority: priority || 'normal'
    };

    const result = await notificationService.sendToUser(userId, notification);

    res.json({
      success: true,
      message: result ? 'Notification sent successfully' : 'User has no registered devices',
      data: { sent: result }
    });
  } catch (error) {
    logger.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

/**
 * Send notification to a helper
 * POST /api/notifications/send/helper
 */
router.post('/send/helper', async (req, res) => {
  try {
    const { helperId, title, body, data, priority } = req.body;

    if (!helperId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Helper ID, title, and body are required'
      });
    }

    const notification = {
      title,
      body,
      data: data || {},
      priority: priority || 'normal'
    };

    const result = await notificationService.sendToHelper(helperId, notification);

    res.json({
      success: true,
      message: result ? 'Notification sent successfully' : 'Helper has no registered devices',
      data: { sent: result }
    });
  } catch (error) {
    logger.error('Error sending notification to helper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

/**
 * Send notification to multiple users
 * POST /api/notifications/send/bulk
 */
router.post('/send/bulk', async (req, res) => {
  try {
    const { userIds, title, body, data, priority } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array, title, and body are required'
      });
    }

    const notification = {
      title,
      body,
      data: data || {},
      priority: priority || 'normal'
    };

    const results = await Promise.allSettled(
      userIds.map(userId => notificationService.sendToUser(userId, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = userIds.length - successful;

    res.json({
      success: true,
      message: `Notifications sent: ${successful} successful, ${failed} failed`,
      data: {
        total: userIds.length,
        successful,
        failed
      }
    });
  } catch (error) {
    logger.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications'
    });
  }
});

/**
 * Send notification to topic
 * POST /api/notifications/send/topic
 */
router.post('/send/topic', async (req, res) => {
  try {
    const { topic, title, body, data, priority } = req.body;

    if (!topic || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Topic, title, and body are required'
      });
    }

    const notification = {
      title,
      body,
      data: data || {},
      priority: priority || 'normal'
    };

    const result = await notificationService.sendToTopic(topic, notification);

    res.json({
      success: true,
      message: result ? 'Notification sent to topic successfully' : 'Failed to send to topic',
      data: { sent: result }
    });
  } catch (error) {
    logger.error('Error sending topic notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

/**
 * Subscribe tokens to topic
 * POST /api/notifications/subscribe
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { tokens, topic } = req.body;

    if (!tokens || !Array.isArray(tokens) || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Tokens array and topic are required'
      });
    }

    const result = await notificationService.subscribeToTopic(tokens, topic);

    res.json({
      success: true,
      message: result ? 'Subscribed to topic successfully' : 'Failed to subscribe',
      data: { subscribed: result }
    });
  } catch (error) {
    logger.error('Error subscribing to topic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe'
    });
  }
});

/**
 * Unsubscribe tokens from topic
 * POST /api/notifications/unsubscribe
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { tokens, topic } = req.body;

    if (!tokens || !Array.isArray(tokens) || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Tokens array and topic are required'
      });
    }

    const result = await notificationService.unsubscribeFromTopic(tokens, topic);

    res.json({
      success: true,
      message: result ? 'Unsubscribed from topic successfully' : 'Failed to unsubscribe',
      data: { unsubscribed: result }
    });
  } catch (error) {
    logger.error('Error unsubscribing from topic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe'
    });
  }
});

/**
 * Send task alert notification
 * POST /api/notifications/task-alert
 */
router.post('/task-alert', async (req, res) => {
  try {
    const { userId, taskId, title, body } = req.body;

    if (!userId || !taskId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Task ID are required'
      });
    }

    const TaskEvent = require('../models/TaskEvent');
    const event = new TaskEvent({
      type: TaskEvent.Types.TASK_ALERT,
      taskId,
      data: { title, body }
    });

    const result = await notificationService.sendTaskAlert(userId, event);

    res.json({
      success: true,
      message: result ? 'Task alert sent successfully' : 'Failed to send task alert',
      data: { sent: result }
    });
  } catch (error) {
    logger.error('Error sending task alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send task alert'
    });
  }
});

/**
 * Send chat notification
 * POST /api/notifications/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { userId, taskId, senderId, message } = req.body;

    if (!userId || !taskId || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Task ID, and message are required'
      });
    }

    const messageData = {
      taskId,
      senderId,
      message
    };

    const result = await notificationService.sendChatNotification(userId, messageData);

    res.json({
      success: true,
      message: result ? 'Chat notification sent successfully' : 'Failed to send chat notification',
      data: { sent: result }
    });
  } catch (error) {
    logger.error('Error sending chat notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send chat notification'
    });
  }
});

module.exports = router;
