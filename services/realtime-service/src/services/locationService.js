/**
 * Location Service
 * Handles helper location updates with obfuscation logic
 */

const logger = require('../config/logger');
const { getRedisClient } = require('../config/redis');
const LocationUpdate = require('../models/LocationUpdate');
const socketService = require('./socketService');

// Distance threshold for showing exact location (in meters)
const EXACT_LOCATION_THRESHOLD = 100;

// H3 resolution for obfuscation (lower = larger hexagons)
const H3_OBFUSCATION_RESOLUTION = 8; // ~0.74 km hexagons

class LocationService {
  constructor() {
    this.redis = null;
  }

  /**
   * Initialize Redis client
   */
  initialize() {
    this.redis = getRedisClient();
    logger.info('LocationService initialized');
  }

  /**
   * Process location update from helper
   * @param {Object} data - Location update data
   * @returns {Promise<Object>} - Processed location
   */
  async processLocationUpdate(data) {
    try {
      const locationUpdate = new LocationUpdate(data);

      if (!locationUpdate.isValid()) {
        throw new Error('Invalid coordinates');
      }

      // Store raw location in Redis
      await this.storeLocation(locationUpdate);

      // Calculate distance to destination if available
      const taskDestination = await this.getTaskDestination(locationUpdate.taskId);
      if (taskDestination) {
        const distance = LocationUpdate.calculateDistance(
          locationUpdate.latitude,
          locationUpdate.longitude,
          taskDestination.latitude,
          taskDestination.longitude
        );
        locationUpdate.distanceToDestination = Math.round(distance);
      }

      // Determine if location should be obfuscated
      const shouldObfuscate = await this.shouldObfuscateLocation(locationUpdate);
      
      if (shouldObfuscate) {
        await this.obfuscateLocation(locationUpdate);
      }

      // Broadcast to task room
      await this.broadcastLocation(locationUpdate);

      // Check for arrival proximity
      await this.checkArrivalProximity(locationUpdate);

      return locationUpdate;
    } catch (error) {
      logger.error('Error processing location update:', error);
      throw error;
    }
  }

  /**
   * Store location in Redis
   */
  async storeLocation(locationUpdate) {
    try {
      const locationKey = locationUpdate.getRedisKey();
      const helperLocationKey = LocationUpdate.getHelperLocationKey(locationUpdate.helperId);
      const taskLocationsKey = LocationUpdate.getTaskLocationsKey(locationUpdate.taskId);

      // Store detailed location data
      await this.redis.setex(
        locationKey,
        3600, // 1 hour TTL
        locationUpdate.toRedisString()
      );

      // Store helper's current location
      await this.redis.setex(
        helperLocationKey,
        3600,
        JSON.stringify({
          taskId: locationUpdate.taskId,
          latitude: locationUpdate.latitude,
          longitude: locationUpdate.longitude,
          timestamp: locationUpdate.timestamp
        })
      );

      // Add to geospatial index
      await this.redis.geoadd(
        taskLocationsKey,
        locationUpdate.longitude,
        locationUpdate.latitude,
        locationUpdate.userId
      );

      // Set TTL on geospatial index
      await this.redis.expire(taskLocationsKey, 86400); // 24 hours

      logger.debug(`Location stored for helper ${locationUpdate.helperId} in task ${locationUpdate.taskId}`);
    } catch (error) {
      logger.error('Failed to store location:', error);
      throw error;
    }
  }

  /**
   * Determine if location should be obfuscated
   */
  async shouldObfuscateLocation(locationUpdate) {
    // If no destination, don't obfuscate
    if (!locationUpdate.distanceToDestination) {
      return false;
    }

    // Obfuscate if more than threshold away
    return locationUpdate.distanceToDestination > EXACT_LOCATION_THRESHOLD;
  }

  /**
   * Obfuscate location using H3 hexagon center
   */
  async obfuscateLocation(locationUpdate) {
    try {
      // For simplicity, we'll use a grid-based obfuscation
      // In production, you'd use the H3 library
      const gridSize = 0.01; // approximately 1km at equator
      
      // Calculate grid cell center
      const latGrid = Math.floor(locationUpdate.latitude / gridSize) * gridSize + gridSize / 2;
      const lonGrid = Math.floor(locationUpdate.longitude / gridSize) * gridSize + gridSize / 2;
      
      locationUpdate.latitude = latGrid;
      locationUpdate.longitude = lonGrid;
      locationUpdate.obfuscated = true;
      locationUpdate.accuracyRadius = Math.round(gridSize * 111000); // Convert to meters (approx)
      
      logger.debug(`Location obfuscated for helper ${locationUpdate.helperId}`);
    } catch (error) {
      logger.error('Failed to obfuscate location:', error);
    }
  }

  /**
   * Broadcast location to task room
   */
  async broadcastLocation(locationUpdate) {
    try {
      const room = `task:${locationUpdate.taskId}`;
      
      // Get all sockets in the room
      const sockets = await socketService.getSocketsInRoom(room);
      
      for (const socketInfo of sockets) {
        // Send different data based on recipient role
        if (socketInfo.userRole === 'BUYER') {
          // Buyer gets potentially obfuscated location
          socketService.broadcastToRoom(
            `user:${socketInfo.userId}`,
            'helper:location',
            locationUpdate.obfuscated 
              ? locationUpdate.toObfuscatedObject()
              : locationUpdate.toBroadcastObject()
          );
        } else if (socketInfo.userRole === 'HELPER') {
          // Other helpers don't get location
          continue;
        } else {
          // Admin or system gets full data
          socketService.broadcastToRoom(
            `user:${socketInfo.userId}`,
            'helper:location',
            locationUpdate.toBroadcastObject()
          );
        }
      }

      logger.debug(`Location broadcast for task ${locationUpdate.taskId}`);
    } catch (error) {
      logger.error('Failed to broadcast location:', error);
    }
  }

  /**
   * Check if helper is arriving (within notification threshold)
   */
  async checkArrivalProximity(locationUpdate) {
    try {
      if (!locationUpdate.distanceToDestination) {
        return;
      }

      const ARRIVAL_THRESHOLD = 200; // meters
      const ARRIVAL_NOTIFICATION_KEY = `arrival:notified:${locationUpdate.taskId}`;

      // Check if already notified
      const alreadyNotified = await this.redis.get(ARRIVAL_NOTIFICATION_KEY);
      
      if (!alreadyNotified && locationUpdate.distanceToDestination <= ARRIVAL_THRESHOLD) {
        // Send arrival notification
        socketService.sendToTask(
          locationUpdate.taskId,
          'helper:arriving',
          {
            taskId: locationUpdate.taskId,
            helperId: locationUpdate.helperId,
            distance: locationUpdate.distanceToDestination,
            estimatedArrival: this.estimateArrival(locationUpdate),
            timestamp: new Date().toISOString()
          }
        );

        // Mark as notified (5 minute cooldown)
        await this.redis.setex(ARRIVAL_NOTIFICATION_KEY, 300, 'true');
        
        logger.info(`Arrival notification sent for helper ${locationUpdate.helperId} in task ${locationUpdate.taskId}`);
      }
    } catch (error) {
      logger.error('Failed to check arrival proximity:', error);
    }
  }

  /**
   * Estimate arrival time based on speed and distance
   */
  estimateArrival(locationUpdate) {
    if (!locationUpdate.speed || locationUpdate.speed <= 0) {
      return null;
    }

    const speedMps = locationUpdate.speed; // assuming speed is in m/s
    const timeSeconds = locationUpdate.distanceToDestination / speedMps;
    const arrivalTime = new Date(Date.now() + timeSeconds * 1000);
    
    return arrivalTime.toISOString();
  }

  /**
   * Get task destination from Redis
   */
  async getTaskDestination(taskId) {
    try {
      const destinationData = await this.redis.get(`task:${taskId}:destination`);
      return destinationData ? JSON.parse(destinationData) : null;
    } catch (error) {
      logger.error('Failed to get task destination:', error);
      return null;
    }
  }

  /**
   * Set task destination
   */
  async setTaskDestination(taskId, latitude, longitude, address) {
    try {
      await this.redis.setex(
        `task:${taskId}:destination`,
        86400, // 24 hours
        JSON.stringify({ latitude, longitude, address })
      );
      logger.info(`Destination set for task ${taskId}`);
    } catch (error) {
      logger.error('Failed to set task destination:', error);
      throw error;
    }
  }

  /**
   * Get helper's current location
   */
  async getHelperLocation(helperId) {
    try {
      const locationData = await this.redis.get(LocationUpdate.getHelperLocationKey(helperId));
      return locationData ? JSON.parse(locationData) : null;
    } catch (error) {
      logger.error('Failed to get helper location:', error);
      return null;
    }
  }

  /**
   * Get all locations for a task
   */
  async getTaskLocations(taskId) {
    try {
      const locations = await this.redis.georadius(
        LocationUpdate.getTaskLocationsKey(taskId),
        0, 0,
        20000, // 20,000 km radius (essentially all)
        'km',
        'WITHCOORD'
      );

      return locations.map(loc => ({
        userId: loc[0],
        longitude: loc[1][0],
        latitude: loc[1][1]
      }));
    } catch (error) {
      logger.error('Failed to get task locations:', error);
      return [];
    }
  }

  /**
   * Get location history for a task
   */
  async getLocationHistory(taskId, userId, limit = 100) {
    try {
      const pattern = `location:${taskId}:${userId}`;
      const locationData = await this.redis.get(pattern);
      
      if (locationData) {
        return [LocationUpdate.fromRedisString(locationData)];
      }
      
      return [];
    } catch (error) {
      logger.error('Failed to get location history:', error);
      return [];
    }
  }

  /**
   * Clear task locations
   */
  async clearTaskLocations(taskId) {
    try {
      await this.redis.del(LocationUpdate.getTaskLocationsKey(taskId));
      await this.redis.del(`task:${taskId}:destination`);
      logger.info(`Cleared locations for task ${taskId}`);
    } catch (error) {
      logger.error('Failed to clear task locations:', error);
    }
  }
}

// Export singleton instance
module.exports = new LocationService();
