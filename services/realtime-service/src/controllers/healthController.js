const express = require('express');
const router = express.Router();
const { getRedisStatus } = require('../config/redis');
const { getRabbitMQStatus } = require('../config/rabbitmq');

// Health check endpoint
router.get('/', async (req, res) => {
  const healthcheck = {
    status: 'UP',
    service: 'realtime-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: {
      redis: getRedisStatus(),
      rabbitmq: getRabbitMQStatus()
    }
  };

  try {
    // Check critical dependencies
    const redisHealthy = getRedisStatus() === 'connected';
    const rabbitmqHealthy = getRabbitMQStatus() === 'connected';

    if (!redisHealthy || !rabbitmqHealthy) {
      healthcheck.status = 'DEGRADED';
      return res.status(503).json(healthcheck);
    }

    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'DOWN';
    healthcheck.error = error.message;
    res.status(503).json(healthcheck);
  }
});

// Readiness check
router.get('/ready', async (req, res) => {
  const redisHealthy = getRedisStatus() === 'connected';
  const rabbitmqHealthy = getRabbitMQStatus() === 'connected';

  if (redisHealthy && rabbitmqHealthy) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ 
      ready: false,
      redis: getRedisStatus(),
      rabbitmq: getRabbitMQStatus()
    });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  res.status(200).json({ alive: true });
});

module.exports = router;