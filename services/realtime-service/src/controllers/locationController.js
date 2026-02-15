/**
 * Location Controller
 * HTTP endpoints for location-related operations
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const locationService = require('../services/locationService');
const { getRedisClient } = require('../config/redis');
const LocationUpdate = require('../models/LocationUpdate');

/**
 * Get helper's current location
 * GET /api/locations/helper/:helperId
 */
router.get('/helper/:helperId', async (req, res) => {
  try {
    const { helperId } = req.params;
    
    const location = await locationService.getHelperLocation(helperId);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    logger.error('Error getting helper location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location'
    });
  }
});

/**
 * Get all locations for a task
 * GET /api/locations/task/:taskId
 */
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const locations = await locationService.getTaskLocations(taskId);
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    logger.error('Error getting task locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get locations'
    });
  }
});

/**
 * Get location history for a task
 * GET /api/locations/task/:taskId/history
 */
router.get('/task/:taskId/history', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, limit = 100 } = req.query;
    
    const history = await locationService.getLocationHistory(
      taskId, 
      userId, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting location history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location history'
    });
  }
});

/**
 * Set task destination
 * POST /api/locations/task/:taskId/destination
 */
router.post('/task/:taskId/destination', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { latitude, longitude, address } = req.body;

    // Validate required fields
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    await locationService.setTaskDestination(taskId, latitude, longitude, address);
    
    res.json({
      success: true,
      message: 'Destination set successfully',
      data: {
        taskId,
        latitude,
        longitude,
        address
      }
    });
  } catch (error) {
    logger.error('Error setting task destination:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set destination'
    });
  }
});

/**
 * Get task destination
 * GET /api/locations/task/:taskId/destination
 */
router.get('/task/:taskId/destination', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const destination = await locationService.getTaskDestination(taskId);
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    res.json({
      success: true,
      data: destination
    });
  } catch (error) {
    logger.error('Error getting task destination:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get destination'
    });
  }
});

/**
 * Calculate distance between two points
 * POST /api/locations/distance
 */
router.post('/distance', async (req, res) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.body;

    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All coordinates are required'
      });
    }

    const distance = LocationUpdate.calculateDistance(lat1, lon1, lat2, lon2);
    
    res.json({
      success: true,
      data: {
        distance: Math.round(distance),
        unit: 'meters'
      }
    });
  } catch (error) {
    logger.error('Error calculating distance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate distance'
    });
  }
});

/**
 * Get nearby helpers (using Redis geospatial)
 * GET /api/locations/nearby
 */
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, unit = 'm' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const redis = getRedisClient();
    
    // Get all online helpers' locations
    // In production, you'd use a geospatial index for all helpers
    const onlineHelpers = await redis.smembers('users:online:HELPER');
    const helperLocations = [];

    for (const helperId of onlineHelpers.slice(0, 100)) { // Limit to 100
      const location = await locationService.getHelperLocation(helperId);
      if (location) {
        const distance = LocationUpdate.calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          location.latitude,
          location.longitude
        );
        
        if (distance <= parseInt(radius)) {
          helperLocations.push({
            helperId,
            distance: Math.round(distance),
            ...location
          });
        }
      }
    }

    // Sort by distance
    helperLocations.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: helperLocations
    });
  } catch (error) {
    logger.error('Error getting nearby helpers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby helpers'
    });
  }
});

module.exports = router;
