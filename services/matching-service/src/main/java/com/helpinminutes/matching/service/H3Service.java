package com.helpinminutes.matching.service;

import com.uber.h3core.H3Core;
import com.uber.h3core.util.LatLng;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service wrapper for Uber H3 hexagonal geospatial indexing.
 * Provides O(1) lookups for geospatial operations using H3 hierarchical grid system.
 * 
 * Default resolution 9 provides hexagons of approximately 170m edge length.
 */
@Slf4j
@Service
public class H3Service {

    @Value("${h3.resolution:9}")
    private int defaultResolution;

    private H3Core h3;

    @PostConstruct
    public void init() {
        try {
            h3 = H3Core.newInstance();
            log.info("H3 Service initialized with default resolution: {}", defaultResolution);
        } catch (IOException e) {
            log.error("Failed to initialize H3 Core", e);
            throw new RuntimeException("Failed to initialize H3 Core", e);
        }
    }

    /**
     * Convert latitude/longitude to H3 cell index at default resolution.
     * 
     * @param lat Latitude in degrees
     * @param lng Longitude in degrees
     * @return H3 cell index as long
     */
    public long latLngToCell(double lat, double lng) {
        return latLngToCell(lat, lng, defaultResolution);
    }

    /**
     * Convert latitude/longitude to H3 cell index at specified resolution.
     * 
     * @param lat Latitude in degrees
     * @param lng Longitude in degrees
     * @param resolution H3 resolution (0-15)
     * @return H3 cell index as long
     */
    public long latLngToCell(double lat, double lng, int resolution) {
        return h3.latLngToCell(lat, lng, resolution);
    }

    /**
     * Convert H3 cell index to latitude/longitude center point.
     * 
     * @param h3Index H3 cell index
     * @return LatLng object containing center coordinates
     */
    public LatLng cellToLatLng(long h3Index) {
        return h3.cellToLatLng(h3Index);
    }

    /**
     * Get the k-ring (hexagonal ring) of cells around a center cell.
     * k=0 returns just the center cell, k=1 returns center + immediate neighbors.
     * 
     * @param h3Index Center H3 cell index
     * @param k Ring size (0 for just center, 1 for neighbors, etc.)
     * @return List of H3 cell indices
     */
    public List<Long> gridDisk(long h3Index, int k) {
        return h3.gridDisk(h3Index, k);
    }

    /**
     * Get the parent cell at a coarser resolution.
     * 
     * @param h3Index Child H3 cell index
     * @param parentResolution Target parent resolution (must be < current resolution)
     * @return Parent H3 cell index
     */
    public long cellToParent(long h3Index, int parentResolution) {
        return h3.cellToParent(h3Index, parentResolution);
    }

    /**
     * Get immediate parent cell (one resolution coarser).
     * 
     * @param h3Index Child H3 cell index
     * @return Parent H3 cell index
     */
    public long cellToParent(long h3Index) {
        int currentRes = h3.getResolution(h3Index);
        return cellToParent(h3Index, currentRes - 1);
    }

    /**
     * Get children cells at a finer resolution.
     * 
     * @param h3Index Parent H3 cell index
     * @param childResolution Target child resolution (must be > current resolution)
     * @return List of child H3 cell indices
     */
    public List<Long> cellToChildren(long h3Index, int childResolution) {
        return h3.cellToChildren(h3Index, childResolution);
    }

    /**
     * Get the resolution of an H3 cell.
     * 
     * @param h3Index H3 cell index
     * @return Resolution level (0-15)
     */
    public int getResolution(long h3Index) {
        return h3.getResolution(h3Index);
    }

    /**
     * Convert H3 cell index to hex string representation.
     * 
     * @param h3Index H3 cell index
     * @return Hex string representation
     */
    public String h3ToString(long h3Index) {
        return Long.toHexString(h3Index);
    }

    /**
     * Convert hex string to H3 cell index.
     * 
     * @param hex Hex string representation
     * @return H3 cell index
     */
    public long stringToH3(String hex) {
        return Long.parseUnsignedLong(hex, 16);
    }

    /**
     * Calculate great circle distance between two H3 cells in kilometers.
     * 
     * @param originH3 Origin H3 cell index
     * @param destH3 Destination H3 cell index
     * @return Distance in kilometers
     */
    public double distanceBetweenCells(long originH3, long destH3) {
        LatLng origin = cellToLatLng(originH3);
        LatLng dest = cellToLatLng(destH3);
        return haversineDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    }

    /**
     * Calculate great circle distance between two lat/lng points in kilometers.
     * 
     * @param lat1 First latitude
     * @param lng1 First longitude
     * @param lat2 Second latitude
     * @param lng2 Second longitude
     * @return Distance in kilometers
     */
    public double distanceBetweenPoints(double lat1, double lng1, double lat2, double lng2) {
        return haversineDistance(lat1, lng1, lat2, lng2);
    }

    /**
     * Calculate distance using Haversine formula.
     */
    private double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371; // Earth's radius in kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Get hexagon edge length in kilometers for a given resolution.
     * 
     * @param resolution H3 resolution
     * @return Edge length in kilometers
     */
    public double getHexagonEdgeLengthKm(int resolution) {
        // H3 resolution 9 has approximately 0.18km edge length
        // Approximate formula: edge length decreases by ~3.4x per resolution
        return 0.18 / Math.pow(3.4, resolution - 9);
    }

    /**
     * Get hexagon area in square kilometers for a given resolution.
     * 
     * @param resolution H3 resolution
     * @return Area in square kilometers
     */
    public double getHexagonAreaKm2(int resolution) {
        // Approximate area based on edge length
        double edge = getHexagonEdgeLengthKm(resolution);
        // Area of regular hexagon = (3 * sqrt(3) / 2) * edge^2
        return (3 * Math.sqrt(3) / 2) * edge * edge;
    }

    /**
     * Check if two cells are neighbors (share an edge).
     * 
     * @param cell1 First H3 cell
     * @param cell2 Second H3 cell
     * @return true if cells are neighbors
     */
    public boolean areNeighbors(long cell1, long cell2) {
        return h3.areNeighborCells(cell1, cell2);
    }

    /**
     * Get all cells within a radius (approximate using k-ring).
     * Uses progressive k-ring expansion to find cells within distance.
     * 
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusKm Radius in kilometers
     * @return List of H3 cell indices within radius
     */
    public List<Long> getCellsInRadius(double lat, double lng, double radiusKm) {
        long centerCell = latLngToCell(lat, lng);
        double edgeLength = getHexagonEdgeLengthKm(defaultResolution);
        int k = (int) Math.ceil(radiusKm / edgeLength);
        return gridDisk(centerCell, Math.min(k, 10)); // Cap at k=10 for performance
    }

    /**
     * Get cells for progressive widening search.
     * Returns cells in concentric rings for efficient nearest-neighbor search.
     * 
     * @param lat Center latitude
     * @param lng Center longitude
     * @param maxK Maximum ring size to search
     * @return List of cell lists, each inner list represents one ring (k=0,1,2...)
     */
    public List<List<Long>> getProgressiveRings(double lat, double lng, int maxK) {
        long centerCell = latLngToCell(lat, lng);
        return java.util.stream.IntStream.rangeClosed(0, maxK)
                .mapToObj(k -> gridDisk(centerCell, k))
                .collect(Collectors.toList());
    }

    /**
     * Get the default resolution configured for this service.
     * 
     * @return Default H3 resolution
     */
    public int getDefaultResolution() {
        return defaultResolution;
    }

    /**
     * Validate that coordinates are within valid ranges.
     * 
     * @param lat Latitude
     * @param lng Longitude
     * @return true if coordinates are valid
     */
    public boolean isValidCoordinates(double lat, double lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
}
