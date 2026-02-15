/**
 * Connection Model
 * Represents active socket connections stored in Redis
 */

class Connection {
  constructor(data) {
    this.socketId = data.socketId;
    this.userId = data.userId;
    this.role = data.role;
    this.helperId = data.helperId || null;
    this.deviceId = data.deviceId || null;
    this.platform = data.platform || 'unknown';
    this.connectedAt = data.connectedAt || new Date().toISOString();
    this.ip = data.ip || null;
    this.lastPingAt = data.lastPingAt || null;
  }

  /**
   * Convert to Redis hash format
   */
  toRedisHash() {
    return {
      socketId: this.socketId,
      userId: this.userId,
      role: this.role,
      helperId: this.helperId || '',
      deviceId: this.deviceId || '',
      platform: this.platform,
      connectedAt: this.connectedAt,
      ip: this.ip || '',
      lastPingAt: this.lastPingAt || ''
    };
  }

  /**
   * Create from Redis hash
   */
  static fromRedisHash(data) {
    return new Connection({
      socketId: data.socketId,
      userId: data.userId,
      role: data.role,
      helperId: data.helperId || null,
      deviceId: data.deviceId || null,
      platform: data.platform,
      connectedAt: data.connectedAt,
      ip: data.ip || null,
      lastPingAt: data.lastPingAt || null
    });
  }

  /**
   * Get Redis key for this connection
   */
  getRedisKey() {
    return `socket:${this.socketId}`;
  }

  /**
   * Get Redis key for user's sockets set
   */
  static getUserSocketsKey(userId) {
    return `user:${userId}:sockets`;
  }

  /**
   * Get Redis key for all active connections
   */
  static getActiveConnectionsKey() {
    return 'connections:active';
  }
}

module.exports = Connection;
