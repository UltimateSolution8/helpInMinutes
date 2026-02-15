/**
 * Authentication Middleware
 * JWT validation for HTTP requests
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Verify JWT token from Authorization header
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.helperId = decoded.helperId || null;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    logger.error('JWT verification error:', error);
    return res.status(403).json({
      success: false,
      message: 'Token verification failed'
    });
  }
}

/**
 * Optional authentication - sets user info if token valid, but doesn't require it
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.helperId = decoded.helperId || null;
    } catch (error) {
      // Invalid token, but we don't fail the request
      logger.debug('Optional auth: Invalid token provided');
    }
  }

  next();
}

/**
 * Require specific role(s)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

/**
 * Require helper role
 */
function requireHelper(req, res, next) {
  if (!req.userRole) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.userRole !== 'HELPER') {
    return res.status(403).json({
      success: false,
      message: 'Helper access required'
    });
  }

  next();
}

/**
 * Require buyer role
 */
function requireBuyer(req, res, next) {
  if (!req.userRole) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.userRole !== 'BUYER') {
    return res.status(403).json({
      success: false,
      message: 'Buyer access required'
    });
  }

  next();
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  if (!req.userRole) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireHelper,
  requireBuyer,
  requireAdmin
};
