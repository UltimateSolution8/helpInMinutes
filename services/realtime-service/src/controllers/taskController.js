/**
 * Task Controller
 * HTTP endpoints for task event operations
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const taskEventService = require('../services/taskEventService');
const socketService = require('../services/socketService');
const { getRedisClient } = require('../config/redis');

/**
 * Get task events
 * GET /api/tasks/:taskId/events
 */
router.get('/:taskId/events', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 50 } = req.query;

    const events = await taskEventService.getTaskEvents(taskId, parseInt(limit));

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error getting task events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task events'
    });
  }
});

/**
 * Broadcast event to task room
 * POST /api/tasks/:taskId/broadcast
 */
router.post('/:taskId/broadcast', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { event, data } = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required'
      });
    }

    taskEventService.broadcastTaskEvent(taskId, event, data || {});

    res.json({
      success: true,
      message: 'Event broadcasted successfully'
    });
  } catch (error) {
    logger.error('Error broadcasting task event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast event'
    });
  }
});

/**
 * Get task room members
 * GET /api/tasks/:taskId/members
 */
router.get('/:taskId/members', async (req, res) => {
  try {
    const { taskId } = req.params;
    const room = `task:${taskId}`;

    const members = await socketService.getSocketsInRoom(room);

    res.json({
      success: true,
      data: {
        taskId,
        memberCount: members.length,
        members
      }
    });
  } catch (error) {
    logger.error('Error getting task room members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room members'
    });
  }
});

/**
 * Join user to task room
 * POST /api/tasks/:taskId/join
 */
router.post('/:taskId/join', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user's sockets
    const sockets = await socketService.getUserSockets(userId);

    if (sockets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User has no active connections'
      });
    }

    // Join all user's sockets to the task room
    const room = `task:${taskId}`;
    for (const socketId of sockets) {
      socketService.joinRoom(socketId, room);
    }

    res.json({
      success: true,
      message: `User ${userId} joined task room ${taskId}`,
      data: {
        taskId,
        userId,
        socketsJoined: sockets.length
      }
    });
  } catch (error) {
    logger.error('Error joining task room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join task room'
    });
  }
});

/**
 * Remove user from task room
 * POST /api/tasks/:taskId/leave
 */
router.post('/:taskId/leave', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user's sockets
    const sockets = await socketService.getUserSockets(userId);

    // Remove all user's sockets from the task room
    const room = `task:${taskId}`;
    for (const socketId of sockets) {
      socketService.leaveRoom(socketId, room);
    }

    res.json({
      success: true,
      message: `User ${userId} left task room ${taskId}`,
      data: {
        taskId,
        userId
      }
    });
  } catch (error) {
    logger.error('Error leaving task room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave task room'
    });
  }
});

/**
 * Trigger task assigned event
 * POST /api/tasks/events/assigned
 */
router.post('/events/assigned', async (req, res) => {
  try {
    const { taskId, helperId, buyerId, helperUserId, ...additionalData } = req.body;

    if (!taskId || !helperId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID and Helper ID are required'
      });
    }

    await taskEventService.handleTaskAssigned({
      taskId,
      helperId,
      buyerId,
      helperUserId,
      ...additionalData
    });

    res.json({
      success: true,
      message: 'Task assigned event processed'
    });
  } catch (error) {
    logger.error('Error processing task assigned:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process task assigned event'
    });
  }
});

/**
 * Trigger task accepted event
 * POST /api/tasks/events/accepted
 */
router.post('/events/accepted', async (req, res) => {
  try {
    const { taskId, helperId, buyerId, userId, ...additionalData } = req.body;

    if (!taskId || !helperId || !buyerId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID, Helper ID, and Buyer ID are required'
      });
    }

    await taskEventService.handleTaskAccepted({
      taskId,
      helperId,
      buyerId,
      userId,
      ...additionalData
    });

    res.json({
      success: true,
      message: 'Task accepted event processed'
    });
  } catch (error) {
    logger.error('Error processing task accepted:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process task accepted event'
    });
  }
});

/**
 * Trigger task started event
 * POST /api/tasks/events/started
 */
router.post('/events/started', async (req, res) => {
  try {
    const { taskId, helperId, buyerId, ...additionalData } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    await taskEventService.handleTaskStarted({
      taskId,
      helperId,
      buyerId,
      ...additionalData
    });

    res.json({
      success: true,
      message: 'Task started event processed'
    });
  } catch (error) {
    logger.error('Error processing task started:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process task started event'
    });
  }
});

/**
 * Trigger task completed event
 * POST /api/tasks/events/completed
 */
router.post('/events/completed', async (req, res) => {
  try {
    const { taskId, helperId, buyerId, ...additionalData } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    await taskEventService.handleTaskCompleted({
      taskId,
      helperId,
      buyerId,
      ...additionalData
    });

    res.json({
      success: true,
      message: 'Task completed event processed'
    });
  } catch (error) {
    logger.error('Error processing task completed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process task completed event'
    });
  }
});

/**
 * Trigger task cancelled event
 * POST /api/tasks/events/cancelled
 */
router.post('/events/cancelled', async (req, res) => {
  try {
    const { taskId, helperId, buyerId, cancelledBy, ...additionalData } = req.body;

    if (!taskId || !cancelledBy) {
      return res.status(400).json({
        success: false,
        message: 'Task ID and cancelledBy are required'
      });
    }

    await taskEventService.handleTaskCancelled({
      taskId,
      helperId,
      buyerId,
      cancelledBy,
      ...additionalData
    });

    res.json({
      success: true,
      message: 'Task cancelled event processed'
    });
  } catch (error) {
    logger.error('Error processing task cancelled:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process task cancelled event'
    });
  }
});

/**
 * Get active tasks with helper assignments
 * GET /api/tasks/active
 */
router.get('/active', async (req, res) => {
  try {
    const redis = getRedisClient();
    
    // Get all keys matching task:*:helpers pattern
    const taskKeys = await redis.keys('task:*:helpers');
    const activeTasks = [];

    for (const key of taskKeys) {
      const taskId = key.replace('task:', '').replace(':helpers', '');
      const helpers = await redis.smembers(key);
      
      if (helpers.length > 0) {
        activeTasks.push({
          taskId,
          helpers,
          memberCount: await socketService.getRoomSize(`task:${taskId}`)
        });
      }
    }

    res.json({
      success: true,
      data: activeTasks
    });
  } catch (error) {
    logger.error('Error getting active tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active tasks'
    });
  }
});

module.exports = router;
