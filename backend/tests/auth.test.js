/**
 * Auth Middleware Tests
 */
const jwt = require('jsonwebtoken');

// Set test env
process.env.JWT_SECRET = 'test-secret-key-for-testing';

const { authenticate, authorize } = require('../src/middleware/auth');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should reject request without authorization header', () => {
      authenticate(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      authenticate(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept request with valid token', () => {
      const token = jwt.sign(
        { id: 'user-123', email: 'test@test.com', role: 'buyer' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;
      authenticate(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe('user-123');
      expect(mockReq.user.role).toBe('buyer');
    });

    it('should reject expired token', () => {
      const token = jwt.sign(
        { id: 'user-123', role: 'buyer' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      // Wait a moment for token to expire
      setTimeout(() => {
        authenticate(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
      }, 100);
    });
  });

  describe('authorize', () => {
    it('should allow access for correct role', () => {
      mockReq.user = { id: 'user-123', role: 'admin' };
      const middleware = authorize('admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for wrong role', () => {
      mockReq.user = { id: 'user-123', role: 'buyer' };
      const middleware = authorize('admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access for multiple roles', () => {
      mockReq.user = { id: 'user-123', role: 'helper' };
      const middleware = authorize('buyer', 'helper');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject unauthenticated request', () => {
      const middleware = authorize('admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
