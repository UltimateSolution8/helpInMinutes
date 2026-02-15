const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;
let redisStatus = 'disconnected';

async function connectRedis() {
  let redisConfig;
  
  if (process.env.REDIS_URL) {
    redisConfig = process.env.REDIS_URL;
  } else {
    redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };
  }
  
  redisClient = new Redis(redisConfig, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
  });

  redisClient.on('connect', () => {
    redisStatus = 'connected';
    logger.info('Redis client connected');
  });

  redisClient.on('error', (err) => {
    redisStatus = 'error';
    logger.error('Redis client error:', err);
  });

  redisClient.on('close', () => {
    redisStatus = 'disconnected';
    logger.warn('Redis client disconnected');
  });

  redisClient.on('reconnecting', () => {
    redisStatus = 'reconnecting';
    logger.info('Redis client reconnecting...');
  });

  return redisClient;
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

function getRedisStatus() {
  return redisStatus;
}

module.exports = {
  connectRedis,
  getRedisClient,
  getRedisStatus
};