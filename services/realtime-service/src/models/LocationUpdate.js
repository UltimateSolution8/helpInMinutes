/**
 * LocationUpdate Model
 * Represents helper location updates with obfuscation support
 */

class LocationUpdate {
  constructor(data) {
    this.id = data.id || require('uuid').v4();
    this.userId = data.userId;
    this.helperId = data.helperId;
    this.taskId = data.taskId;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.accuracy = data.accuracy || 0;
    this.heading = data.heading || null;
    this.speed = data.speed || null;
    this.timestamp = data.timestamp || new Date().toISOString();
    
    // Obfuscation fields
    this.obfuscated = data.obfuscated || false;
    this.h3Index = data.h3Index || null;
    this.accuracyRadius = data.accuracyRadius || 0;
    this.distanceToDestination = data.distanceToDestination || null;
  }

  /**
   * Validate coordinates
   */
  isValid() {
    return (
      this.latitude >= -90 && 
      this.latitude <= 90 && 
      this.longitude >= -180 && 
      this.longitude <= 180
    );
  }

  /**
   * Convert to object for broadcasting
   */
  toBroadcastObject() {
    return {
      helperId: this.helperId,
      taskId: this.taskId,
      latitude: this.latitude,
      longitude: this.longitude,
      accuracy: this.accuracy,
      heading: this.heading,
      speed: this.speed,
      timestamp: this.timestamp,
      obfuscated: this.obfuscated,
      accuracyRadius: this.accuracyRadius
    };
  }

  /**
   * Convert to obfuscated object for buyer (when helper is far)
   */
  toObfuscatedObject() {
    return {
      helperId: this.helperId,
      taskId: this.taskId,
      latitude: this.latitude, // H3 cell center
      longitude: this.longitude, // H3 cell center
      accuracy: Math.max(this.accuracy, this.accuracyRadius),
      heading: null, // Hide heading when obfuscated
      speed: null, // Hide speed when obfuscated
      timestamp: this.timestamp,
      obfuscated: true,
      accuracyRadius: this.accuracyRadius,
      distanceToDestination: this.distanceToDestination
    };
  }

  /**
   * Convert to Redis storage format
   */
  toRedisString() {
    return JSON.stringify({
      id: this.id,
      userId: this.userId,
      helperId: this.helperId,
      taskId: this.taskId,
      latitude: this.latitude,
      longitude: this.longitude,
      accuracy: this.accuracy,
      heading: this.heading,
      speed: this.speed,
      timestamp: this.timestamp
    });
  }

  /**
   * Create from Redis storage
   */
  static fromRedisString(str) {
    const data = JSON.parse(str);
    return new LocationUpdate(data);
  }

  /**
   * Get Redis key for location storage
   */
  getRedisKey() {
    return `location:${this.taskId}:${this.userId}`;
  }

  /**
   * Get Redis key for task locations geospatial index
   */
  static getTaskLocationsKey(taskId) {
    return `task:${taskId}:locations`;
  }

  /**
   * Get Redis key for helper's current location
   */
  static getHelperLocationKey(helperId) {
    return `helper:${helperId}:location`;
  }

  /**
   * Calculate distance between two coordinates in meters (Haversine formula)
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

module.exports = LocationUpdate;
