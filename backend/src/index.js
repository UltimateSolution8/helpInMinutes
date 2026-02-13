/**
 * helpInMinutes Backend Server
 * Main entry point - Express + Socket.io
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const helperRoutes = require('./routes/helpers');
const skillRoutes = require('./routes/skills');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');

const app = express();
const server = http.createServer(app);

// Socket.io for real-time tracking
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
  path: '/ws',
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'helpinminutes', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/helpers', helperRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ code: 404, message: 'Not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ code: 500, message: 'Internal server error' });
});

// Socket.io authentication and real-time tracking
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info('Socket connected', { userId: socket.user.id, role: socket.user.role });

  socket.on('joinTask', ({ taskId }) => {
    socket.join(`task:${taskId}`);
    logger.info('Joined task room', { userId: socket.user.id, taskId });
  });

  socket.on('leaveTask', ({ taskId }) => {
    socket.leave(`task:${taskId}`);
  });

  // Helper streams location
  socket.on('location', (data) => {
    if (socket.user.role === 'helper' && data.taskId) {
      io.to(`task:${data.taskId}`).emit('helper:location', {
        helperId: socket.user.id,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Task status updates
  socket.on('taskUpdate', (data) => {
    if (data.taskId) {
      io.to(`task:${data.taskId}`).emit('task:status', {
        taskId: data.taskId,
        status: data.status,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { userId: socket.user.id });
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`helpInMinutes backend running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API base: http://localhost:${PORT}/api/v1`);
});

module.exports = { app, server };
