/**
 * Presence Controller
 * HTTP endpoints for presence/online status operations
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const presenceService = require('../services/presenceService');

/**
 * Get user's presence status
 * GET /api/presence/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const presence = await presenceService.getPresence(userId);
    
    res.json({
      success: true,
      data: presence
    });
  } catch (error) {
    logger.error('Error getting presence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get presence status'
    });
  }
});

/**
 * Get presence for multiple users (bulk)
 * POST /api/presence/bulk
 */
router.post('/bulk', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const presences = await presenceService.getBulkPresence(userIds);
    
    res.json({
      success: true,
      data: presences
    });
  } catch (error) {
    logger.error('Error getting bulk presence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get presence statuses'
    });
  }
});

/**
 * Check if user is online
 * GET /api/presence/:userId/online
 */
router.get('/:userId/online', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const isOnline = await presenceService.isOnline(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        isOnline
      }
    });
  } catch (error) {
    logger.error('Error checking online status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check online status'
    });
  }
});

/**
 * Get all online users
 * GET /api/presence/online/users
 */
router.get('/online/users', async (req, res) => {
  try {
    const users = await presenceService.getOnlineUsers();
    
    res.json({
      success: true,
      data: {
        count: users.length,
        users
      }
    });
  } catch (error) {
    logger.error('Error getting online users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get online users'
    });
  }
});

/**
 * Get all online helpers
 * GET /api/presence/online/helpers
 */
router.get('/online/helpers', async (req, res) => {
  try {
    const helpers = await presenceService.getOnlineHelpers();
    
    res.json({
      success: true,
      data: {
        count: helpers.length,
        helpers
      }
    });
  } catch (error) {
    logger.error('Error getting online helpers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get online helpers'
    });
  }
});

/**
 * Get all online buyers
 * GET /api/presence/online/buyers
 */
router.get('/online/buyers', async (req, res) => {
  try {
    const buyers = await presenceService.getOnlineBuyers();
    
    res.json({
      success: true,
      data: {
        count: buyers.length,
        buyers
      }
    });
  } catch (error) {
    logger.error('Error getting online buyers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get online buyers'
    });
  }
});

/**
 * Get presence statistics
 * GET /api/presence/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await presenceService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting presence stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get presence statistics'
    });
  }
});

/**
 * Set user's activity status
 * POST /api/presence/:userId/activity
 */
router.post('/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await presenceService.setActivityStatus(userId, status);
    
    if (result) {
      res.json({
        success: true,
        message: 'Activity status updated successfully',
        data: {
          userId,
          status
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update activity status'
      });
    }
  } catch (error) {
    logger.error('Error setting activity status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set activity status'
    });
  }
});

/**
 * Get user's activity status
 * GET /api/presence/:userId/activity
 */
router.get('/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const status = await presenceService.getActivityStatus(userId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting activity status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity status'
    });
  }
});

module.exports = router;
