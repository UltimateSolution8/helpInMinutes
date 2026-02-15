import { io } from 'socket.io-client';
import { store } from '../store';
import { setTaskAlert, setActiveTask } from '../store/slices/helperTaskSlice';
import { setOnlineStatus } from '../store/slices/helperAuthSlice';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'wss://api.helpinminutes.com';

/**
 * Socket.io Service for real-time communication with helpers
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;
  }

  /**
   * Initialize socket connection
   */
  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });

    // Task related events
    this.socket.on('task:alert', (task) => {
      console.log('New task alert received:', task.id);
      store.dispatch(setTaskAlert(task));
    });

    this.socket.on('task:cancelled', (data) => {
      console.log('Task cancelled:', data.taskId);
      const state = store.getState();
      if (state.helperTask.activeTask?.id === data.taskId) {
        store.dispatch(setActiveTask(null));
      }
    });

    this.socket.on('task:accepted', (task) => {
      console.log('Task accepted:', task.id);
      store.dispatch(setActiveTask(task));
      store.dispatch(setTaskAlert(null));
    });

    this.socket.on('task:started', (task) => {
      console.log('Task started:', task.id);
      store.dispatch(setActiveTask(task));
    });

    this.socket.on('task:completed', (task) => {
      console.log('Task completed:', task.id);
      store.dispatch(setActiveTask(null));
    });

    // Online status events
    this.socket.on('online:status:updated', (data) => {
      store.dispatch(setOnlineStatus(data.isOnline));
    });

    // Safety events
    this.socket.on('safety:alert:received', (data) => {
      console.log('Safety alert received:', data);
      // Handle safety alert - could show a modal or notification
    });

    // Earnings events
    this.socket.on('earnings:updated', (data) => {
      console.log('Earnings updated:', data);
      // Handle earnings update
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('helper:heartbeat', {
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Emit location update
   */
  emitLocationUpdate(location) {
    if (this.socket?.connected) {
      this.socket.emit('location:update', location);
    }
  }

  /**
   * Accept task
   */
  emitTaskAccept(taskId) {
    if (this.socket?.connected) {
      this.socket.emit('task:accept', { taskId });
    }
  }

  /**
   * Decline task
   */
  emitTaskDecline(taskId, reason) {
    if (this.socket?.connected) {
      this.socket.emit('task:decline', { taskId, reason });
    }
  }

  /**
   * Start task
   */
  emitTaskStart(taskId) {
    if (this.socket?.connected) {
      this.socket.emit('task:start', { taskId });
    }
  }

  /**
   * Complete task
   */
  emitTaskComplete(taskId, otp) {
    if (this.socket?.connected) {
      this.socket.emit('task:complete', { taskId, otp });
    }
  }

  /**
   * Request task cancellation
   */
  emitTaskCancel(taskId, reason) {
    if (this.socket?.connected) {
      this.socket.emit('task:cancel', { taskId, reason });
    }
  }

  /**
   * Update online status
   */
  emitOnlineStatus(isOnline) {
    if (this.socket?.connected) {
      this.socket.emit('online:status', { isOnline });
    }
  }

  /**
   * Emit safety panic button
   */
  emitSafetyAlert(location) {
    if (this.socket?.connected) {
      this.socket.emit('safety:panic', {
        location,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Join helper room
   */
  joinHelperRoom(helperId) {
    if (this.socket?.connected) {
      this.socket.emit('helper:join', { helperId });
    }
  }

  /**
   * Leave helper room
   */
  leaveHelperRoom(helperId) {
    if (this.socket?.connected) {
      this.socket.emit('helper:leave', { helperId });
    }
  }

  /**
   * Subscribe to specific task updates
   */
  subscribeToTask(taskId) {
    if (this.socket?.connected) {
      this.socket.emit('task:subscribe', { taskId });
    }
  }

  /**
   * Unsubscribe from task updates
   */
  unsubscribeFromTask(taskId) {
    if (this.socket?.connected) {
      this.socket.emit('task:unsubscribe', { taskId });
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
