/**
 * Auth Routes - Login, Register, Refresh, Logout
 * Pattern inspired by spring-security OAuth2 token exchange
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );
  const refreshToken = uuidv4();
  return { accessToken, refreshToken };
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ code: 400, message: 'Email, password, and name are required' });
    }
    const validRoles = ['buyer', 'helper'];
    const userRole = validRoles.includes(role) ? role : 'buyer';

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ code: 409, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name, userRole, phone || null]
    );
    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    logger.info('User registered', { userId: user.id, role: userRole });
    res.status(201).json({ accessToken, refreshToken, user });
  } catch (err) {
    logger.error('Registration error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ code: 400, message: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ code: 401, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ code: 401, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    logger.info('User logged in', { userId: user.id });
    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/auth/oauth/google (mock for local dev)
router.post('/oauth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ code: 400, message: 'idToken is required' });
    }

    // In production, verify with Google. For local dev, mock the verification.
    // DEPENDENCY DISCLOSURE: Google OAuth - API Key Required: YES, Mock Implemented: YES
    const mockGoogleUser = {
      email: `google_${Date.now()}@test.com`,
      name: 'Google Test User',
    };

    let result = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [mockGoogleUser.email]);
    let user;
    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO users (email, name, role) VALUES ($1, $2, 'buyer') RETURNING id, email, name, role`,
        [mockGoogleUser.email, mockGoogleUser.name]
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    logger.error('Google OAuth error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ code: 400, message: 'refreshToken is required' });
    }

    const result = await pool.query(
      `SELECT rt.*, u.id as user_id, u.email, u.name, u.role
       FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.revoked = false AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ code: 401, message: 'Invalid or expired refresh token' });
    }

    const row = result.rows[0];
    // Revoke old token
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [refreshToken]);

    const user = { id: row.user_id, email: row.email, name: row.name, role: row.role };
    const tokens = generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokens.refreshToken, expiresAt]
    );

    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
  } catch (err) {
    logger.error('Token refresh error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = true WHERE token = $1 AND user_id = $2',
        [refreshToken, req.user.id]
      );
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Logout error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// GET /api/v1/auth/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, phone, preferred_language, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Profile fetch error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

module.exports = router;
