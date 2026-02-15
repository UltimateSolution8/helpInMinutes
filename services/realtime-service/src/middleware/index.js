/**
 * Middleware index
 * Export all middleware for easy importing
 */

const auth = require('./auth');
const rateLimiter = require('./rateLimiter');

module.exports = {
  ...auth,
  ...rateLimiter
};
