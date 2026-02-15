/**
 * Rate Limiter Middleware
 * Rate limiting for socket and HTTP requests
 */

const { RateLimiterRedis } = require('rate-limiter-flexible');
const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

// Rate limiters
let socketConnectionLimiter;
let locationUpdateLimiter;
let chatMessageLimiter;
let apiRequestLimiter;

/**
 * Initialize rate limiters
 */
function initializeRateLimiters() {
  const redisClient = getRedisClient();

  // Socket connection limiter: 10 connections per minute per IP
  socketConnectionLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'socket_conn_limit',
    points: 10,
    duration: 60,
  });

  // Location update limiter: 1 update per 2 seconds per user
  locationUpdateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'location_limit',
    points: 1,
    duration: 2,
  });

  // Chat message limiter: 30 messages per minute per user
  chatMessageLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'chat_limit',
    points: 30,
    duration: 60,
  });

  // API request limiter: 100 requests per minute per user
  apiRequestLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'api_limit',
    points: 100,
    duration: 60,
  });

  logger.info('Rate limiters initialized');
}

/**
 * Socket connection rate limiter middleware
 */
async function socketConnectionRateLimit(socket, next) {
  try {
    const clientIp = socket.handshake.address;
    await socketConnectionLimiter.consume(clientIp);
    next();
  } catch (rejRes) {
    logger.warn(`Socket connection rate limited for IP: ${socket.handshake.address}`);
    next(new Error('Rate limit exceeded. Please try again later.'));
  }
}

/**
 * Location update rate limiter
 */
async function locationRateLimit(userId) {
  try {
    await locationUpdateLimiter.consume(userId);
    return { allowed: true };
  } catch (rejRes) {
    logger.debug(`Location update rate limited for user: ${userId}`);
    return { 
      allowed: false, 
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) 
    };
  }
}

/**
 * Chat message rate limiter
 */
async function chatRateLimit(userId) {
  try {
    await chatMessageLimiter.consume(userId);
    return { allowed: true };
  } catch (rejRes) {
    logger.debug(`Chat message rate limited for user: ${userId}`);
    return { 
      allowed: false, 
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) 
    };
  }
}

/**
 * HTTP API rate limiter middleware
 */
function apiRateLimit(req, res, next) {
  const key = req.userId || req.ip;
  
  apiRequestLimiter.consume(key)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      logger.warn(`API rate limited for: ${key}`);
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: Math.round(rejRes.msBeforeNext / 1000)
      });
    });
}

/**
 * Custom rate limiter middleware factory
 */
function createRateLimiter(options) {
  const { points, duration, keyPrefix, keyGenerator } = options;
  
  const limiter = new RateLimiterRedis({
    storeClient: getRedisClient(),
    keyPrefix: keyPrefix || 'custom_limit',
    points,
    duration,
  });

  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : (req.userId || req.ip);
    
    limiter.consume(key)
      .then(() => {
        next();
      })
      .catch((rejRes) => {
        logger.warn(`Rate limited for: ${key}`);
        res.status(429).json({
          success: false,
          message: 'Too many requests',
          retryAfter: Math.round(rejRes.msBeforeNext / 1000)
        });
      });
  };
}

module.exports = {
  initializeRateLimiters,
  socketConnectionRateLimit,
  locationRateLimit,
  chatRateLimit,
  apiRateLimit,
  createRateLimiter
};
