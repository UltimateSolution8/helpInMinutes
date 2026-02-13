/**
 * Skills Routes - Public skill taxonomy endpoints
 */
const express = require('express');
const pool = require('../db/pool');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/v1/skills - Get full skill hierarchy
router.get('/', async (req, res) => {
  try {
    const { lang = 'en' } = req.query;

    const categories = await pool.query(
      `SELECT c.id, c.name, c.name_hi, c.name_te, c.slug, c.icon, c.sort_order
       FROM categories c WHERE c.is_active = true ORDER BY c.sort_order, c.name`
    );

    const result = [];
    for (const cat of categories.rows) {
      const skills = await pool.query(
        `SELECT s.id, s.name, s.name_hi, s.name_te, s.slug
         FROM skills s WHERE s.category_id = $1 AND s.is_active = true
         ORDER BY s.sort_order, s.name`,
        [cat.id]
      );

      const skillsWithSubs = [];
      for (const skill of skills.rows) {
        const subSkills = await pool.query(
          `SELECT ss.id, ss.name, ss.name_hi, ss.name_te, ss.slug, ss.aliases,
                  ss.skill_level, ss.avg_base_rate
           FROM sub_skills ss WHERE ss.skill_id = $1 AND ss.is_active = true
           ORDER BY ss.name`,
          [skill.id]
        );

        skillsWithSubs.push({
          ...skill,
          displayName: lang === 'hi' ? (skill.name_hi || skill.name) : lang === 'te' ? (skill.name_te || skill.name) : skill.name,
          subSkills: subSkills.rows.map(ss => ({
            ...ss,
            displayName: lang === 'hi' ? (ss.name_hi || ss.name) : lang === 'te' ? (ss.name_te || ss.name) : ss.name,
          })),
        });
      }

      result.push({
        ...cat,
        displayName: lang === 'hi' ? (cat.name_hi || cat.name) : lang === 'te' ? (cat.name_te || cat.name) : cat.name,
        skills: skillsWithSubs,
      });
    }

    res.json({ items: result, total: result.length });
  } catch (err) {
    logger.error('Skills fetch error', { error: err.message });
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

module.exports = router;
