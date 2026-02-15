/**
 * Chat Controller
 * HTTP endpoints for in-app chat operations
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { getRedisClient } = require('../config/redis');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');

/**
 * Get chat messages for a task
 * GET /api/chat/:taskId/messages
 */
router.get('/:taskId/messages', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 50, before } = req.query;

    const redis = getRedisClient();
    const chatKey = `chat:${taskId}`;

    let messages;
    if (before) {
      // Get messages before a specific message ID or timestamp
      const allMessages = await redis.lrange(chatKey, 0, -1);
      messages = allMessages
        .map(m => JSON.parse(m))
        .filter(m => new Date(m.timestamp) < new Date(before))
        .slice(0, parseInt(limit));
    } else {
      // Get most recent messages
      const rawMessages = await redis.lrange(chatKey, 0, parseInt(limit) - 1);
      messages = rawMessages.map(m => JSON.parse(m));
    }

    res.json({
      success: true,
      data: {
        taskId,
        messages: messages.reverse(), // Return in chronological order
        count: messages.length
      }
    });
  } catch (error) {
    logger.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat messages'
    });
  }
});

/**
 * Send a chat message via HTTP (fallback for when socket is not available)
 * POST /api/chat/:taskId/messages
 */
router.post('/:taskId/messages', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { senderId, recipientId, message, senderRole } = req.body;

    if (!senderId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Sender ID and message are required'
      });
    }

    const redis = getRedisClient();
    const chatKey = `chat:${taskId}`;

    const chatMessage = {
      id: require('uuid').v4(),
      taskId,
      senderId,
      senderRole: senderRole || 'UNKNOWN',
      recipientId: recipientId || null,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Store in Redis
    await redis.lpush(chatKey, JSON.stringify(chatMessage));
    await redis.ltrim(chatKey, 0, 199); // Keep last 200 messages
    await redis.expire(chatKey, 86400 * 7); // 7 days TTL

    // Broadcast via socket
    socketService.sendToTask(taskId, 'chat:message', chatMessage);

    // Send push notification if recipient is not online
    if (recipientId) {
      const isOnline = await socketService.isUserOnline(recipientId);
      if (!isOnline) {
        await notificationService.sendChatNotification(recipientId, chatMessage);
      }
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });
  } catch (error) {
    logger.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

/**
 * Mark messages as read
 * POST /api/chat/:taskId/read
 */
router.post('/:taskId/read', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, messageIds } = req.body;

    if (!userId || !messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: 'User ID and message IDs array are required'
      });
    }

    // Broadcast read receipt via socket
    socketService.sendToTask(taskId, 'chat:read_receipt', {
      taskId,
      userId,
      messageIds,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

/**
 * Get unread message count for a user in a task
 * GET /api/chat/:taskId/unread
 */
router.get('/:taskId/unread', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, lastRead } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const redis = getRedisClient();
    const chatKey = `chat:${taskId}`;

    // Get all messages
    const rawMessages = await redis.lrange(chatKey, 0, -1);
    const messages = rawMessages.map(m => JSON.parse(m));

    // Count unread messages
    let unreadCount = 0;
    if (lastRead) {
      const lastReadTime = new Date(lastRead);
      unreadCount = messages.filter(m => 
        m.senderId !== userId && new Date(m.timestamp) > lastReadTime
      ).length;
    } else {
      unreadCount = messages.filter(m => m.senderId !== userId).length;
    }

    res.json({
      success: true,
      data: {
        taskId,
        userId,
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

/**
 * Get chat participants for a task
 * GET /api/chat/:taskId/participants
 */
router.get('/:taskId/participants', async (req, res) => {
  try {
    const { taskId } = req.params;
    const room = `task:${taskId}`;

    // Get all sockets in the room
    const sockets = await socketService.getSocketsInRoom(room);
    
    // Extract unique users
    const participants = [];
    const seenUserIds = new Set();

    for (const socket of sockets) {
      if (!seenUserIds.has(socket.userId)) {
        seenUserIds.add(socket.userId);
        
        // Get presence info
        const presence = await require('../services/presenceService').getPresence(socket.userId);
        
        participants.push({
          userId: socket.userId,
          role: socket.userRole,
          isOnline: presence.status === 'online'
        });
      }
    }

    res.json({
      success: true,
      data: {
        taskId,
        participants,
        count: participants.length
      }
    });
  } catch (error) {
    logger.error('Error getting chat participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get participants'
    });
  }
});

/**
 * Delete a chat message
 * DELETE /api/chat/:taskId/messages/:messageId
 */
router.delete('/:taskId/messages/:messageId', async (req, res) => {
  try {
    const { taskId, messageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const redis = getRedisClient();
    const chatKey = `chat:${taskId}`;

    // Get all messages
    const rawMessages = await redis.lrange(chatKey, 0, -1);
    const messages = rawMessages.map(m => JSON.parse(m));

    // Find the message
    const messageIndex = messages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const message = messages[messageIndex];

    // Check if user is authorized to delete (only sender or admin)
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Remove message from list
    // Note: Redis doesn't have a direct remove by value, so we rebuild the list
    const updatedMessages = messages.filter(m => m.id !== messageId);
    
    // Clear and rebuild the list
    await redis.del(chatKey);
    if (updatedMessages.length > 0) {
      const pipeline = redis.pipeline();
      for (const msg of updatedMessages.reverse()) {
        pipeline.lpush(chatKey, JSON.stringify(msg));
      }
      pipeline.expire(chatKey, 86400 * 7);
      await pipeline.exec();
    }

    // Broadcast deletion via socket
    socketService.sendToTask(taskId, 'chat:message_deleted', {
      taskId,
      messageId,
      deletedBy: userId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

/**
 * Clear chat history for a task
 * DELETE /api/chat/:taskId/messages
 */
router.delete('/:taskId/messages', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const redis = getRedisClient();
    const chatKey = `chat:${taskId}`;

    // Delete all messages
    await redis.del(chatKey);

    // Broadcast clear event via socket
    socketService.sendToTask(taskId, 'chat:cleared', {
      taskId,
      clearedBy: userId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    logger.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history'
    });
  }
});

module.exports = router;
