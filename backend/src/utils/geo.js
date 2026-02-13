/**
 * Geospatial Utilities using H3
 * Pattern inspired by uber/h3 library
 * 
 * H3 is used for candidate discovery (O(1) lookup).
 * Haversine is used for display/ETA only.
 */
const h3 = require('h3-js');

const H3_RESOLUTION = parseInt(process.env.H3_RESOLUTION || '9', 10);
const H3_KRING_MAX = parseInt(process.env.H3_KRING_MAX || '3', 10);

/**
 * Convert lat/lng to H3 index at configured resolution
 */
function latLngToH3(lat, lng) {
  return h3.latLngToCell(lat, lng, H3_RESOLUTION);
}

/**
 * Get neighboring H3 cells using kRing expansion
 * @param {string} h3Index - Center H3 cell
 * @param {number} k - Ring size (0 = just center, 1 = center + neighbors, etc.)
 * @returns {string[]} Array of H3 cell indexes
 */
function getKRingCells(h3Index, k = 1) {
  return h3.gridDisk(h3Index, k);
}

/**
 * Progressive kRing expansion for matching
 * Starts from ring 0 and expands up to H3_KRING_MAX
 */
function getProgressiveRings(h3Index) {
  const rings = [];
  for (let k = 0; k <= H3_KRING_MAX; k++) {
    rings.push({
      ring: k,
      cells: h3.gridDisk(h3Index, k),
    });
  }
  return rings;
}

/**
 * Haversine distance between two points (for display only)
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Estimate ETA based on distance (simple model: avg 20 km/h in city)
 * @returns {number} ETA in minutes
 */
function estimateETA(distanceKm) {
  const avgSpeedKmH = 20;
  return Math.ceil((distanceKm / avgSpeedKmH) * 60);
}

module.exports = {
  latLngToH3,
  getKRingCells,
  getProgressiveRings,
  haversineDistance,
  estimateETA,
  H3_RESOLUTION,
  H3_KRING_MAX,
};
