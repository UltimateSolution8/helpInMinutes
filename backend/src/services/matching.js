/**
 * Matching Engine Service
 * Uses H3 kRing for candidate discovery, weighted scoring for ranking
 * Pattern inspired by uber/h3 spatial indexing approach
 */
const pool = require('../db/pool');
const { getProgressiveRings, haversineDistance, estimateETA } = require('../utils/geo');
const logger = require('../utils/logger');

// Configurable weights for multi-factor ranking
const WEIGHTS = {
  proximity: 0.4,
  skillMatch: 0.25,
  rating: 0.2,
  responseRate: 0.15,
};

/**
 * Find and rank helpers for a task
 * @param {string} taskH3Index - H3 index of the task location
 * @param {number} taskLat - Task latitude
 * @param {number} taskLng - Task longitude
 * @param {string} subSkillId - Required sub-skill ID
 * @param {number} topK - Number of top candidates to return
 * @returns {Array} Ranked list of helper candidates
 */
async function findHelpers(taskH3Index, taskLat, taskLng, subSkillId, topK = 5) {
  const rings = getProgressiveRings(taskH3Index);

  for (const { ring, cells } of rings) {
    const placeholders = cells.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT hp.id, hp.user_id, hp.current_lat, hp.current_lng, hp.rating,
             hp.total_tasks_completed, u.name,
             CASE WHEN hs.sub_skill_id IS NOT NULL THEN 1.0 ELSE 0.5 END as skill_match
      FROM helper_profiles hp
      JOIN users u ON hp.user_id = u.id
      LEFT JOIN helper_skills hs ON hp.id = hs.helper_id AND hs.sub_skill_id = $${cells.length + 1}
      WHERE hp.is_online = true
        AND hp.kyc_status = 'VERIFIED'
        AND hp.current_h3_index IN (${placeholders})
        AND NOT EXISTS (
          SELECT 1 FROM tasks t
          WHERE t.helper_id = hp.user_id
          AND t.status IN ('ACCEPTED', 'IN_PROGRESS')
        )
    `;

    const params = [...cells, subSkillId];
    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      const scored = result.rows.map(helper => {
        const distance = haversineDistance(taskLat, taskLng, helper.current_lat, helper.current_lng);
        const eta = estimateETA(distance);
        const proximityScore = 1 / (1 + distance); // Closer = higher score
        const ratingScore = (helper.rating || 0) / 5;
        const skillScore = helper.skill_match;
        const responseScore = Math.min(helper.total_tasks_completed / 100, 1);

        const totalScore =
          WEIGHTS.proximity * proximityScore +
          WEIGHTS.skillMatch * skillScore +
          WEIGHTS.rating * ratingScore +
          WEIGHTS.responseRate * responseScore;

        return {
          helperId: helper.user_id,
          helperProfileId: helper.id,
          name: helper.name,
          distance: Math.round(distance * 100) / 100,
          eta,
          rating: helper.rating,
          skillMatch: helper.skill_match,
          score: Math.round(totalScore * 1000) / 1000,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      const topCandidates = scored.slice(0, topK);

      logger.info('Matching completed', {
        ring,
        candidatesFound: result.rows.length,
        topK: topCandidates.length,
      });

      return topCandidates;
    }

    logger.info(`No helpers found in ring ${ring}, expanding...`);
  }

  logger.warn('No helpers found after full kRing expansion');
  return [];
}

module.exports = { findHelpers };
