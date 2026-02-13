/**
 * Admin Routes - KYC approval, skill management, task monitoring
 */
const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// GET /api/v1/admin/helpers/pending - List pending KYC helpers
router.get('/helpers/pending', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT hp.*, u.name, u.email, u.phone
       FROM helper_profiles hp
       JOIN users u ON hp.user_id = u.id
       WHERE hp.kyc_status IN ('PENDING', 'PENDING_MANUAL')
       ORDER BY hp.created_at ASC`
    );
    res.json({ items: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Admin pending helpers error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/admin/helpers/:helperId/kyc - Approve/Reject KYC
router.post('/helpers/:helperId/kyc', async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ code: 400, message: 'action must be "approve" or "reject"' });
    }

    const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';
    const result = await pool.query(
      `UPDATE helper_profiles SET kyc_status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, user_id, kyc_status`,
      [newStatus, req.params.helperId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: 'Helper not found' });
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, 'helper_profile', $3, $4)`,
      [req.user.id, `KYC_${action.toUpperCase()}`, req.params.helperId,
       JSON.stringify({ reason: reason || '', newStatus })]
    );

    logger.info('KYC decision made', {
      helperId: req.params.helperId,
      action,
      adminId: req.user.id,
    });

    res.json({ helperId: req.params.helperId, kycStatus: newStatus });
  } catch (err) {
    logger.error('Admin KYC action error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// CRUD for skills
// POST /api/v1/admin/skills
router.post('/skills', async (req, res) => {
  try {
    const { categoryId, name, nameHi, nameTe, slug, parentSkillId } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ code: 400, message: 'name and slug are required' });
    }

    if (parentSkillId) {
      // Creating a sub-skill
      const result = await pool.query(
        `INSERT INTO sub_skills (skill_id, name, name_hi, name_te, slug)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [parentSkillId, name, nameHi || null, nameTe || null, slug]
      );
      res.status(201).json(result.rows[0]);
    } else if (categoryId) {
      // Creating a skill
      const result = await pool.query(
        `INSERT INTO skills (category_id, name, name_hi, name_te, slug)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [categoryId, name, nameHi || null, nameTe || null, slug]
      );
      res.status(201).json(result.rows[0]);
    } else {
      // Creating a category
      const result = await pool.query(
        `INSERT INTO categories (name, name_hi, name_te, slug)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, nameHi || null, nameTe || null, slug]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    logger.error('Admin skill create error', { error: err.message });
    if (err.code === '23505') {
      return res.status(409).json({ code: 409, message: 'Slug already exists' });
    }
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// GET /api/v1/admin/skills
router.get('/skills', async (req, res) => {
  try {
    const categories = await pool.query('SELECT * FROM categories ORDER BY sort_order, name');
    const skills = await pool.query('SELECT * FROM skills ORDER BY sort_order, name');
    const subSkills = await pool.query('SELECT * FROM sub_skills ORDER BY name');
    res.json({ categories: categories.rows, skills: skills.rows, subSkills: subSkills.rows });
  } catch (err) {
    logger.error('Admin skills list error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// DELETE /api/v1/admin/skills?id=...&type=...
router.delete('/skills', async (req, res) => {
  try {
    const { id, type } = req.query;
    if (!id || !type) {
      return res.status(400).json({ code: 400, message: 'id and type (category|skill|subskill) are required' });
    }

    const table = type === 'category' ? 'categories' : type === 'skill' ? 'skills' : 'sub_skills';
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.status(204).send();
  } catch (err) {
    logger.error('Admin skill delete error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// GET /api/v1/admin/tasks/active
router.get('/tasks/active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as buyer_name, h.name as helper_name, ss.name as sub_skill_name
       FROM tasks t
       LEFT JOIN users u ON t.buyer_id = u.id
       LEFT JOIN users h ON t.helper_id = h.id
       LEFT JOIN sub_skills ss ON t.sub_skill_id = ss.id
       WHERE t.status NOT IN ('COMPLETED', 'CANCELLED', 'FAILED')
       ORDER BY t.created_at DESC`
    );
    res.json({ items: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Admin active tasks error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/admin/tasks/:taskId/reassign
router.post('/tasks/:taskId/reassign', async (req, res) => {
  try {
    const { action, targetHelperId, reason } = req.body;
    if (!action || !['reassign', 'cancel'].includes(action)) {
      return res.status(400).json({ code: 400, message: 'action must be "reassign" or "cancel"' });
    }

    if (action === 'cancel') {
      await pool.query(
        `UPDATE tasks SET status = 'CANCELLED', cancellation_reason = $1, updated_at = NOW()
         WHERE id = $2`,
        [reason || 'Admin cancelled', req.params.taskId]
      );
    } else if (action === 'reassign' && targetHelperId) {
      await pool.query(
        `UPDATE tasks SET helper_id = $1, status = 'ACCEPTED', updated_at = NOW()
         WHERE id = $2`,
        [targetHelperId, req.params.taskId]
      );
    }

    // Audit
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, 'task', $3, $4)`,
      [req.user.id, `TASK_${action.toUpperCase()}`, req.params.taskId,
       JSON.stringify({ reason, targetHelperId })]
    );

    res.json({ taskId: req.params.taskId, action });
  } catch (err) {
    logger.error('Admin task reassign error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// GET /api/v1/admin/dashboard - Platform metrics
router.get('/dashboard', async (req, res) => {
  try {
    const [tasks, helpers, buyers, payments] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`),
      pool.query(`SELECT kyc_status, COUNT(*) as count FROM helper_profiles GROUP BY kyc_status`),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'buyer'`),
      pool.query(`SELECT SUM(amount) as total, COUNT(*) as count FROM payments WHERE status = 'CAPTURED'`),
    ]);

    res.json({
      tasks: tasks.rows,
      helpers: helpers.rows,
      totalBuyers: parseInt(buyers.rows[0]?.count || 0),
      payments: {
        totalRevenue: parseFloat(payments.rows[0]?.total || 0),
        totalTransactions: parseInt(payments.rows[0]?.count || 0),
      },
    });
  } catch (err) {
    logger.error('Admin dashboard error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

module.exports = router;
