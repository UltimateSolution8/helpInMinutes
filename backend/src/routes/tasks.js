/**
 * Task Routes - Create, Accept, Start, Complete, Cancel
 * Implements strict state machine: CREATED → MATCHING → DISPATCHED → ACCEPTED → IN_PROGRESS → COMPLETED
 */
const express = require('express');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');
const { latLngToH3 } = require('../utils/geo');
const { findHelpers } = require('../services/matching');
const logger = require('../utils/logger');

const router = express.Router();

// Valid state transitions
const VALID_TRANSITIONS = {
  CREATED: ['MATCHING', 'CANCELLED'],
  MATCHING: ['DISPATCHED', 'FAILED', 'CANCELLED'],
  DISPATCHED: ['ACCEPTED', 'FAILED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: ['MATCHING'], // Allow retry
};

async function transitionTask(taskId, fromStatus, toStatus, actorId, details = {}) {
  if (!VALID_TRANSITIONS[fromStatus] || !VALID_TRANSITIONS[fromStatus].includes(toStatus)) {
    throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
  }

  const result = await pool.query(
    `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 AND status = $3 RETURNING *`,
    [toStatus, taskId, fromStatus]
  );

  if (result.rows.length === 0) {
    throw new Error('Task not found or status already changed (concurrent modification)');
  }

  // Record event in audit trail
  await pool.query(
    `INSERT INTO task_events (task_id, from_status, to_status, actor_id, details) VALUES ($1, $2, $3, $4, $5)`,
    [taskId, fromStatus, toStatus, actorId, JSON.stringify(details)]
  );

  return result.rows[0];
}

// POST /api/v1/tasks - Create a task (buyer)
router.post('/', authenticate, authorize('buyer'), async (req, res) => {
  try {
    const { title, description, lat, lng, subSkillId } = req.body;
    if (!title || lat == null || lng == null || !subSkillId) {
      return res.status(400).json({ code: 400, message: 'title, lat, lng, and subSkillId are required' });
    }

    const h3Index = latLngToH3(lat, lng);

    // Verify sub-skill exists
    const skillCheck = await pool.query('SELECT id FROM sub_skills WHERE id = $1', [subSkillId]);
    if (skillCheck.rows.length === 0) {
      return res.status(400).json({ code: 400, message: 'Invalid subSkillId' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (buyer_id, title, description, lat, lng, h3_index, sub_skill_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'CREATED')
       RETURNING id, status, h3_index, created_at`,
      [req.user.id, title, description || '', lat, lng, h3Index, subSkillId]
    );

    const task = result.rows[0];

    // Record creation event
    await pool.query(
      `INSERT INTO task_events (task_id, to_status, actor_id, details) VALUES ($1, 'CREATED', $2, $3)`,
      [task.id, req.user.id, JSON.stringify({ title, lat, lng })]
    );

    // Trigger matching asynchronously
    setImmediate(async () => {
      try {
        await transitionTask(task.id, 'CREATED', 'MATCHING', req.user.id);
        const helpers = await findHelpers(h3Index, lat, lng, subSkillId);

        if (helpers.length > 0) {
          await transitionTask(task.id, 'MATCHING', 'DISPATCHED', req.user.id, {
            candidateCount: helpers.length,
            topHelper: helpers[0].helperId,
          });
          logger.info('Task dispatched', { taskId: task.id, candidates: helpers.length });
        } else {
          await transitionTask(task.id, 'MATCHING', 'FAILED', req.user.id, {
            reason: 'No helpers available',
          });
          logger.warn('No helpers found for task', { taskId: task.id });
        }
      } catch (err) {
        logger.error('Matching failed', { taskId: task.id, error: err.message });
      }
    });

    logger.info('Task created', { taskId: task.id, buyerId: req.user.id });
    res.status(201).json({ taskId: task.id, status: task.status, h3Index: task.h3_index });
  } catch (err) {
    logger.error('Task creation error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// GET /api/v1/tasks - List buyer's tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    let query, countQuery, params;
    if (req.user.role === 'admin') {
      query = `SELECT t.*, u.name as buyer_name, ss.name as sub_skill_name
               FROM tasks t
               LEFT JOIN users u ON t.buyer_id = u.id
               LEFT JOIN sub_skills ss ON t.sub_skill_id = ss.id`;
      countQuery = 'SELECT COUNT(*) FROM tasks';
      params = [];
    } else if (req.user.role === 'helper') {
      query = `SELECT t.*, u.name as buyer_name, ss.name as sub_skill_name
               FROM tasks t
               LEFT JOIN users u ON t.buyer_id = u.id
               LEFT JOIN sub_skills ss ON t.sub_skill_id = ss.id
               WHERE t.helper_id = $1`;
      countQuery = 'SELECT COUNT(*) FROM tasks WHERE helper_id = $1';
      params = [req.user.id];
    } else {
      query = `SELECT t.*, ss.name as sub_skill_name
               FROM tasks t
               LEFT JOIN sub_skills ss ON t.sub_skill_id = ss.id
               WHERE t.buyer_id = $1`;
      countQuery = 'SELECT COUNT(*) FROM tasks WHERE buyer_id = $1';
      params = [req.user.id];
    }

    if (status) {
      const statusFilter = ` ${params.length > 0 ? 'AND' : 'WHERE'} t.status = $${params.length + 1}`;
      query += statusFilter;
      countQuery += statusFilter.replace('t.status', 'status');
      params.push(status);
    }

    const countResult = await pool.query(countQuery, params);
    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await pool.query(query, params);
    res.json({
      items: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (err) {
    logger.error('Task list error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// GET /api/v1/tasks/:taskId
router.get('/:taskId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as buyer_name, h.name as helper_name, ss.name as sub_skill_name
       FROM tasks t
       LEFT JOIN users u ON t.buyer_id = u.id
       LEFT JOIN users h ON t.helper_id = h.id
       LEFT JOIN sub_skills ss ON t.sub_skill_id = ss.id
       WHERE t.id = $1`,
      [req.params.taskId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Task fetch error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// POST /api/v1/tasks/:taskId/accept - Helper accepts (atomic claim)
router.post('/:taskId/accept', authenticate, authorize('helper'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Atomic claim using optimistic locking
    const result = await client.query(
      `UPDATE tasks SET helper_id = $1, status = 'ACCEPTED', updated_at = NOW()
       WHERE id = $2 AND status = 'DISPATCHED' AND helper_id IS NULL
       RETURNING *`,
      [req.user.id, req.params.taskId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ code: 409, message: 'Task already claimed or not available' });
    }

    // Record event
    await client.query(
      `INSERT INTO task_events (task_id, from_status, to_status, actor_id, details)
       VALUES ($1, 'DISPATCHED', 'ACCEPTED', $2, $3)`,
      [req.params.taskId, req.user.id, JSON.stringify({ helperId: req.user.id })]
    );

    await client.query('COMMIT');

    const task = result.rows[0];
    logger.info('Task accepted', { taskId: task.id, helperId: req.user.id });
    res.json({ taskId: task.id, helperId: req.user.id, status: 'ACCEPTED' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Task accept error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/v1/tasks/:taskId/start
router.post('/:taskId/start', authenticate, authorize('helper'), async (req, res) => {
  try {
    const task = await transitionTask(req.params.taskId, 'ACCEPTED', 'IN_PROGRESS', req.user.id);
    logger.info('Task started', { taskId: task.id });
    res.json({ taskId: task.id, status: 'IN_PROGRESS' });
  } catch (err) {
    logger.error('Task start error', { error: err.message });
    res.status(400).json({ code: 400, message: err.message });
  }
});

// POST /api/v1/tasks/:taskId/complete
router.post('/:taskId/complete', authenticate, authorize('helper'), async (req, res) => {
  try {
    const { completionNotes, finalAmount } = req.body;
    const task = await transitionTask(req.params.taskId, 'IN_PROGRESS', 'COMPLETED', req.user.id, {
      completionNotes,
      finalAmount,
    });

    if (finalAmount) {
      await pool.query('UPDATE tasks SET price = $1, completion_notes = $2 WHERE id = $3',
        [finalAmount, completionNotes || '', task.id]);
    }

    logger.info('Task completed', { taskId: task.id });
    res.json({ taskId: task.id, status: 'COMPLETED' });
  } catch (err) {
    logger.error('Task complete error', { error: err.message });
    res.status(400).json({ code: 400, message: err.message });
  }
});

// DELETE /api/v1/tasks/:taskId - Cancel task
router.delete('/:taskId', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ code: 404, message: 'Task not found' });
    }

    const task = taskResult.rows[0];
    // Only buyer or admin can cancel
    if (task.buyer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: 'Not authorized to cancel this task' });
    }

    const updated = await transitionTask(task.id, task.status, 'CANCELLED', req.user.id, { reason });
    await pool.query('UPDATE tasks SET cancellation_reason = $1 WHERE id = $2', [reason || '', task.id]);

    logger.info('Task cancelled', { taskId: task.id, reason });
    res.json({ taskId: updated.id, status: 'CANCELLED' });
  } catch (err) {
    logger.error('Task cancel error', { error: err.message });
    res.status(400).json({ code: 400, message: err.message });
  }
});

// GET /api/v1/tasks/:taskId/history
router.get('/:taskId/history', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT te.*, u.name as actor_name
       FROM task_events te
       LEFT JOIN users u ON te.actor_id = u.id
       WHERE te.task_id = $1
       ORDER BY te.created_at ASC`,
      [req.params.taskId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Task history error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

module.exports = router;
