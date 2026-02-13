/**
 * Authentication & Authorization Middleware
 * Pattern inspired by spring-security JWT filter approach
 */
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token from Authorization header
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: 'Token expired' });
    }
    return res.status(401).json({ code: 401, message: 'Invalid token' });
  }
}

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      return res.status(403).json({ code: 403, message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
