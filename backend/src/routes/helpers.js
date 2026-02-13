/**
 * Helper Routes - Registration, KYC, Status, Heartbeat
 */
const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const { latLngToH3 } = require('../utils/geo');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/v1/helpers/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, skills } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ code: 400, message: 'name, email, password, and phone are required' });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, phone)
       VALUES ($1, $2, $3, 'helper', $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name, role`,
      [email, passwordHash, name, phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(409).json({ code: 409, message: 'Email already registered' });
    }

    const user = userResult.rows[0];

    // Create helper profile
    const profileResult = await pool.query(
      `INSERT INTO helper_profiles (user_id, kyc_status)
       VALUES ($1, 'PENDING')
       RETURNING id, kyc_status`,
      [user.id]
    );

    const profile = profileResult.rows[0];

    // Assign skills if provided
    if (skills && Array.isArray(skills)) {
      for (const skillId of skills) {
        await pool.query(
          `INSERT INTO helper_skills (helper_id, sub_skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [profile.id, skillId]
        );
      }
    }

    logger.info('Helper registered', { userId: user.id, helperId: profile.id });
    res.status(201).json({ helperId: profile.id, userId: user.id, kycStatus: profile.kyc_status });
  } catch (err) {
    logger.error('Helper registration error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/helpers/:helperId/kyc/upload (mock file upload)
router.post('/:helperId/kyc/upload', authenticate, async (req, res) => {
  try {
    // DEPENDENCY DISCLOSURE: File Storage (S3) - Mock Implemented: YES
    // In production, use multer + S3. For local dev, mock the upload.
    const { helperId } = req.params;

    await pool.query(
      `UPDATE helper_profiles SET
        aadhaar_doc_path = $1,
        pan_doc_path = $2,
        selfie_path = $3,
        kyc_status = 'PENDING_MANUAL',
        updated_at = NOW()
       WHERE id = $4`,
      [
        `/uploads/aadhaar_${helperId}.jpg`,
        `/uploads/pan_${helperId}.jpg`,
        `/uploads/selfie_${helperId}.jpg`,
        helperId,
      ]
    );

    // Record audit
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
       VALUES ($1, 'KYC_UPLOAD', 'helper_profile', $2, $3)`,
      [req.user.id, helperId, JSON.stringify({ status: 'PENDING_MANUAL' })]
    );

    logger.info('KYC documents uploaded', { helperId });
    res.json({ helperId, kycStatus: 'PENDING_MANUAL' });
  } catch (err) {
    logger.error('KYC upload error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// PATCH /api/v1/helpers/:helperId/status - Toggle online/offline
router.patch('/:helperId/status', authenticate, authorize('helper'), async (req, res) => {
  try {
    const { online, currentLat, currentLng } = req.body;
    const { helperId } = req.params;

    // Verify helper is verified before going online
    if (online) {
      const profile = await pool.query(
        'SELECT kyc_status FROM helper_profiles WHERE id = $1',
        [helperId]
      );
      if (profile.rows.length === 0 || profile.rows[0].kyc_status !== 'VERIFIED') {
        return res.status(403).json({
          code: 403,
          message: 'Helper must have verified KYC to go online',
        });
      }
    }

    const h3Index = (online && currentLat && currentLng)
      ? latLngToH3(currentLat, currentLng)
      : null;

    await pool.query(
      `UPDATE helper_profiles SET
        is_online = $1,
        current_lat = $2,
        current_lng = $3,
        current_h3_index = $4,
        last_seen_at = NOW(),
        updated_at = NOW()
       WHERE id = $5`,
      [online, currentLat || null, currentLng || null, h3Index, helperId]
    );

    res.json({ helperId, online, h3Index });
  } catch (err) {
    logger.error('Helper status update error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/helpers/:helperId/heartbeat - Location update
router.post('/:helperId/heartbeat', authenticate, authorize('helper'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ code: 400, message: 'lat and lng are required' });
    }

    const h3Index = latLngToH3(lat, lng);
    await pool.query(
      `UPDATE helper_profiles SET
        current_lat = $1, current_lng = $2, current_h3_index = $3,
        last_seen_at = NOW()
       WHERE id = $4 AND is_online = true`,
      [lat, lng, h3Index, req.params.helperId]
    );

    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Heartbeat error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// GET /api/v1/helpers/:helperId/tasks
router.get('/:helperId/tasks', authenticate, authorize('helper'), async (req, res) => {
  try {
    const profile = await pool.query('SELECT user_id FROM helper_profiles WHERE id = $1', [req.params.helperId]);
    if (profile.rows.length === 0) {
      return res.status(404).json({ code: 404, message: 'Helper not found' });
    }

    const result = await pool.query(
      `SELECT t.*, ss.name as sub_skill_name, u.name as buyer_name
       FROM tasks t
       LEFT JOIN sub_skills ss ON t.sub_skill_id = ss.id
       LEFT JOIN users u ON t.buyer_id = u.id
       WHERE t.helper_id = $1
       ORDER BY t.created_at DESC`,
      [profile.rows[0].user_id]
    );

    res.json({ items: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Helper tasks error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

module.exports = router;
