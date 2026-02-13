/**
 * Geospatial Utility Tests
 * Tests H3 conversion, kRing expansion, and Haversine distance
 */
const { latLngToH3, getKRingCells, getProgressiveRings, haversineDistance, estimateETA } = require('../src/utils/geo');

describe('Geospatial Utilities', () => {
  describe('latLngToH3', () => {
    it('should convert Hyderabad coordinates to H3 index', () => {
      const h3Index = latLngToH3(17.4500, 78.3910);
      expect(h3Index).toBeDefined();
      expect(typeof h3Index).toBe('string');
      expect(h3Index.length).toBeGreaterThan(0);
    });

    it('should return different indexes for different locations', () => {
      const h3A = latLngToH3(17.4500, 78.3910); // Hyderabad
      const h3B = latLngToH3(28.6139, 77.2090); // Delhi
      expect(h3A).not.toBe(h3B);
    });

    it('should return same index for nearby points', () => {
      const h3A = latLngToH3(17.4500, 78.3910);
      const h3B = latLngToH3(17.4501, 78.3911); // Very close
      expect(h3A).toBe(h3B);
    });
  });

  describe('getKRingCells', () => {
    it('should return center cell for k=0', () => {
      const h3Index = latLngToH3(17.4500, 78.3910);
      const cells = getKRingCells(h3Index, 0);
      expect(cells).toHaveLength(1);
      expect(cells[0]).toBe(h3Index);
    });

    it('should return 7 cells for k=1', () => {
      const h3Index = latLngToH3(17.4500, 78.3910);
      const cells = getKRingCells(h3Index, 1);
      expect(cells.length).toBe(7);
      expect(cells).toContain(h3Index);
    });

    it('should return 19 cells for k=2', () => {
      const h3Index = latLngToH3(17.4500, 78.3910);
      const cells = getKRingCells(h3Index, 2);
      expect(cells.length).toBe(19);
    });
  });

  describe('getProgressiveRings', () => {
    it('should return rings from 0 to max', () => {
      const h3Index = latLngToH3(17.4500, 78.3910);
      const rings = getProgressiveRings(h3Index);
      expect(rings.length).toBeGreaterThan(0);
      expect(rings[0].ring).toBe(0);
      expect(rings[0].cells).toHaveLength(1);
    });
  });

  describe('haversineDistance', () => {
    it('should return 0 for same point', () => {
      const dist = haversineDistance(17.45, 78.39, 17.45, 78.39);
      expect(dist).toBe(0);
    });

    it('should calculate distance between Hyderabad and Delhi (~1250 km)', () => {
      const dist = haversineDistance(17.3850, 78.4867, 28.6139, 77.2090);
      expect(dist).toBeGreaterThan(1200);
      expect(dist).toBeLessThan(1300);
    });

    it('should calculate short distance correctly', () => {
      // ~1 km apart
      const dist = haversineDistance(17.4500, 78.3910, 17.4590, 78.3910);
      expect(dist).toBeGreaterThan(0.5);
      expect(dist).toBeLessThan(2);
    });
  });

  describe('estimateETA', () => {
    it('should estimate ETA for 5km at ~15 minutes', () => {
      const eta = estimateETA(5);
      expect(eta).toBe(15);
    });

    it('should estimate ETA for 0km as 0 minutes', () => {
      const eta = estimateETA(0);
      expect(eta).toBe(0);
    });
  });
});
