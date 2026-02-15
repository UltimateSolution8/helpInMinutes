const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const logger = require('./config/logger');
const { setupSocketHandlers } = require('./config/socket');
const { connectRedis } = require('./config/redis');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { setupRabbitMQListeners } = require('./messaging/rabbitmqListeners');
const { initializeRateLimiters } = require('./middleware/rateLimiter');

// Import services
const socketService = require('./services/socketService');
const locationService = require('./services/locationService');
const taskEventService = require('./services/taskEventService');
const notificationService = require('./services/notificationService');
const presenceService = require('./services/presenceService');

// Import controllers
const {
  locationController,
  taskController,
  notificationController,
  chatController,
  presenceController,
  healthController
} = require('./controllers');

// Import middleware
const { authenticateToken, apiRateLimit } = require('./middleware');

const PORT = process.env.PORT || 8085;

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json());

// Rate limiting for API routes
app.use('/api', apiRateLimit);

// Health check routes (no auth required)
app.use('/health', healthController);

// API routes (auth required)
app.use('/api/locations', authenticateToken, locationController);
app.use('/api/tasks', authenticateToken, taskController);
app.use('/api/notifications', authenticateToken, notificationController);
app.use('/api/chat', authenticateToken, chatController);
app.use('/api/presence', authenticateToken, presenceController);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Store io instance globally for use in other modules
global.io = io;

// Initialize connections and start server
async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Connect to RabbitMQ
    await connectRabbitMQ();
    logger.info('RabbitMQ connected successfully');

    // Initialize rate limiters
    initializeRateLimiters();
    logger.info('Rate limiters initialized');

    // Initialize services
    socketService.initialize(io);
    locationService.initialize();
    taskEventService.initialize();
    notificationService.initialize();
    presenceService.initialize();
    logger.info('Services initialized');

    // Setup RabbitMQ listeners
    await setupRabbitMQListeners();
    logger.info('RabbitMQ listeners started');

    // Setup Socket.IO handlers
    setupSocketHandlers(io);
    logger.info('Socket.IO handlers initialized');

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Realtime Service running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Stop RabbitMQ consumers
  const { stopConsumers } = require('./messaging/rabbitmqListeners');
  await stopConsumers();

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Stop RabbitMQ consumers
  const { stopConsumers } = require('./messaging/rabbitmqListeners');
  await stopConsumers();

  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = { app, server, io };
