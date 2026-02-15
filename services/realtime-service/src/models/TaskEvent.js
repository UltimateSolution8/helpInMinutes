/**
 * TaskEvent Model
 * Represents task-related events for broadcasting and persistence
 */

class TaskEvent {
  constructor(data) {
    this.id = data.id || require('uuid').v4();
    this.type = data.type; // TASK_ASSIGNED, TASK_ACCEPTED, TASK_STARTED, etc.
    this.taskId = data.taskId;
    this.userId = data.userId || null;
    this.helperId = data.helperId || null;
    this.buyerId = data.buyerId || null;
    this.data = data.data || {}; // Additional event-specific data
    this.timestamp = data.timestamp || new Date().toISOString();
    this.priority = data.priority || 'normal'; // low, normal, high, critical
  }

  /**
   * Event type constants
   */
  static Types = {
    // Task lifecycle events
    TASK_ASSIGNED: 'task:assigned',
    TASK_ACCEPTED: 'task:accepted',
    TASK_DECLINED: 'task:declined',
    TASK_STARTED: 'task:started',
    TASK_COMPLETED: 'task:completed',
    TASK_CANCELLED: 'task:cancelled',
    TASK_EXPIRED: 'task:expired',
    
    // Helper events
    HELPER_LOCATION: 'helper:location',
    HELPER_ARRIVING: 'helper:arriving',
    HELPER_ARRIVED: 'helper:arrived',
    HELPER_EN_ROUTE: 'helper:en_route',
    
    // Alert events
    TASK_ALERT: 'task:alert',
    TASK_REMINDER: 'task:reminder',
    
    // Payment events
    PAYMENT_COMPLETED: 'payment:completed',
    PAYMENT_FAILED: 'payment:failed',
    
    // Status events
    STATUS_CHANGED: 'status:changed'
  };

  /**
   * Priority levels
   */
  static Priorities = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  /**
   * Convert to broadcast format
   */
  toBroadcastObject() {
    return {
      id: this.id,
      type: this.type,
      taskId: this.taskId,
      userId: this.userId,
      helperId: this.helperId,
      buyerId: this.buyerId,
      data: this.data,
      timestamp: this.timestamp,
      priority: this.priority
    };
  }

  /**
   * Convert to RabbitMQ message format
   */
  toRabbitMQMessage() {
    return Buffer.from(JSON.stringify({
      id: this.id,
      type: this.type,
      taskId: this.taskId,
      userId: this.userId,
      helperId: this.helperId,
      buyerId: this.buyerId,
      data: this.data,
      timestamp: this.timestamp,
      priority: this.priority,
      source: 'realtime-service'
    }));
  }

  /**
   * Convert to Redis storage format
   */
  toRedisString() {
    return JSON.stringify({
      id: this.id,
      type: this.type,
      taskId: this.taskId,
      userId: this.userId,
      helperId: this.helperId,
      buyerId: this.buyerId,
      data: this.data,
      timestamp: this.timestamp,
      priority: this.priority
    });
  }

  /**
   * Create from Redis storage
   */
  static fromRedisString(str) {
    const data = JSON.parse(str);
    return new TaskEvent(data);
  }

  /**
   * Get Redis key for task events list
   */
  getTaskEventsKey() {
    return `task:${this.taskId}:events`;
  }

  /**
   * Get Redis key for user's events list
   */
  getUserEventsKey() {
    return `user:${this.userId}:events`;
  }

  /**
   * Get RabbitMQ routing key
   */
  getRoutingKey() {
    return `task.${this.type.split(':')[1]}`;
  }

  /**
   * Get Socket.io event name
   */
  getSocketEventName() {
    return this.type;
  }

  /**
   * Check if this event should trigger a push notification
   */
  shouldNotify() {
    const notifyTypes = [
      TaskEvent.Types.TASK_ASSIGNED,
      TaskEvent.Types.TASK_ALERT,
      TaskEvent.Types.HELPER_ARRIVING,
      TaskEvent.Types.PAYMENT_COMPLETED,
      TaskEvent.Types.TASK_CANCELLED
    ];
    return notifyTypes.includes(this.type) || this.priority === TaskEvent.Priorities.HIGH || this.priority === TaskEvent.Priorities.CRITICAL;
  }

  /**
   * Get notification title based on event type
   */
  getNotificationTitle() {
    const titles = {
      [TaskEvent.Types.TASK_ASSIGNED]: 'New Task Assigned',
      [TaskEvent.Types.TASK_ACCEPTED]: 'Task Accepted',
      [TaskEvent.Types.TASK_STARTED]: 'Task Started',
      [TaskEvent.Types.TASK_COMPLETED]: 'Task Completed',
      [TaskEvent.Types.TASK_CANCELLED]: 'Task Cancelled',
      [TaskEvent.Types.HELPER_ARRIVING]: 'Helper Arriving Soon',
      [TaskEvent.Types.HELPER_ARRIVED]: 'Helper Has Arrived',
      [TaskEvent.Types.TASK_ALERT]: 'New Task Available',
      [TaskEvent.Types.PAYMENT_COMPLETED]: 'Payment Confirmed'
    };
    return titles[this.type] || 'HelpInMinutes Update';
  }

  /**
   * Get notification body based on event type
   */
  getNotificationBody() {
    switch (this.type) {
      case TaskEvent.Types.TASK_ASSIGNED:
        return `You've been assigned a new task (#${this.taskId})`;
      case TaskEvent.Types.TASK_ACCEPTED:
        return `Helper has accepted your task (#${this.taskId})`;
      case TaskEvent.Types.TASK_STARTED:
        return `Task #${this.taskId} has started`;
      case TaskEvent.Types.TASK_COMPLETED:
        return `Task #${this.taskId} has been completed`;
      case TaskEvent.Types.TASK_CANCELLED:
        return `Task #${this.taskId} has been cancelled`;
      case TaskEvent.Types.HELPER_ARRIVING:
        return 'Your helper is arriving soon!';
      case TaskEvent.Types.HELPER_ARRIVED:
        return 'Your helper has arrived at your location';
      case TaskEvent.Types.TASK_ALERT:
        return 'A new task is available near you';
      case TaskEvent.Types.PAYMENT_COMPLETED:
        return `Payment of $${this.data?.amount || 0} confirmed`;
      default:
        return 'You have a new update';
    }
  }
}

module.exports = TaskEvent;
