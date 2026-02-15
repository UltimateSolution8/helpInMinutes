import { io, Socket } from 'socket.io-client';

const REALTIME_SERVICE_URL = process.env.NEXT_PUBLIC_REALTIME_SERVICE_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(REALTIME_SERVICE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Re-attach listeners after reconnection
    this.socket.on('reconnect', () => {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket?.on(event, callback);
        });
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  subscribe<T = unknown>(event: string, callback: (...args: T[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const typedCallback = callback as (...args: unknown[]) => void;
    this.listeners.get(event)?.add(typedCallback);

    this.socket?.on(event, typedCallback);

    return () => {
      this.listeners.get(event)?.delete(typedCallback);
      this.socket?.off(event, typedCallback);
    };
  }

  // Task events
  subscribeToTaskUpdates(callback: (task: unknown) => void): () => void {
    return this.subscribe('task:updated', callback);
  }

  subscribeToNewTasks(callback: (task: unknown) => void): () => void {
    return this.subscribe('task:created', callback);
  }

  subscribeToTaskCompleted(callback: (task: unknown) => void): () => void {
    return this.subscribe('task:completed', callback);
  }

  // Helper events
  subscribeToHelperOnline(callback: (data: { helperId: string; status: boolean }) => void): () => void {
    return this.subscribe('helper:online', callback);
  }

  subscribeToHelperLocation(callback: (data: { helperId: string; location: { latitude: number; longitude: number } }) => void): () => void {
    return this.subscribe('helper:location', callback);
  }

  // Payment events
  subscribeToPaymentReceived(callback: (payment: unknown) => void): () => void {
    return this.subscribe('payment:received', callback);
  }

  // Dispute events
  subscribeToNewDisputes(callback: (dispute: unknown) => void): () => void {
    return this.subscribe('dispute:raised', callback);
  }

  // KYC events
  subscribeToKycUpdates(callback: (data: { helperId: string; status: string }) => void): () => void {
    return this.subscribe('kyc:updated', callback);
  }

  // Send events
  emitTaskAssignment(taskId: string, helperId: string): void {
    this.socket?.emit('task:assign', { taskId, helperId });
  }

  emitHelperNotification(helperId: string, notification: unknown): void {
    this.socket?.emit('notification:send', { helperId, notification });
  }

  joinRoom(room: string): void {
    this.socket?.emit('join:room', room);
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave:room', room);
  }
}

export const socketService = new SocketService();
export default socketService;
