package com.helpinminutes.matching.algorithm;

import com.helpinminutes.matching.dto.CandidateHelper;
import com.helpinminutes.matching.service.H3Service;
import com.helpinminutes.matching.service.HelperLocationIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Finds candidate helpers using H3 k-ring lookup for O(1) geospatial search.
 * Implements progressive widening: kRing 0 → 1 → 2 → 3
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CandidateFinder {

    private final H3Service h3Service;
    private final HelperLocationIndexService locationIndexService;

    // Maximum k-ring to search (increasing this expands search radius)
    private static final int MAX_K_RING = 3;
    
    // Maximum candidates to return (for performance)
    private static final int MAX_CANDIDATES = 50;

    /**
     * Find candidate helpers near a location using progressive H3 k-ring widening.
     * 
     * @param lat Task latitude
     * @param lng Task longitude
     * @param maxRadiusKm Maximum search radius in km
     * @return List of candidate helpers with location data
     */
    public List<CandidateHelper> findCandidates(double lat, double lng, double maxRadiusKm) {
        long startTime = System.currentTimeMillis();
        long taskH3Cell = h3Service.latLngToCell(lat, lng);
        
        Set<String> candidateIds = new LinkedHashSet<>(); // Preserve order
        Map<String, Long> helperToH3Cell = new HashMap<>();
        
        // Progressive widening: kRing 0 → 1 → 2 → 3
        for (int k = 0; k <= MAX_K_RING; k++) {
            List<Long> ringCells = h3Service.gridDisk(taskH3Cell, k);
            
            // Get helpers in this ring
            Map<Long, Set<String>> helpersInCells = locationIndexService.getHelpersInCells(ringCells);
            
            for (Map.Entry<Long, Set<String>> entry : helpersInCells.entrySet()) {
                long cellH3 = entry.getKey();
                for (String helperId : entry.getValue()) {
                    if (!candidateIds.contains(helperId)) {
                        candidateIds.add(helperId);
                        helperToH3Cell.put(helperId, cellH3);
                    }
                }
            }
            
            // Check if we have enough candidates
            if (candidateIds.size() >= MAX_CANDIDATES) {
                log.debug("Found {} candidates at k-ring {}, stopping search", candidateIds.size(), k);
                break;
            }
            
            // Check if we've exceeded max radius
            double currentRadius = estimateRadiusForK(k);
            if (currentRadius >= maxRadiusKm) {
                log.debug("Reached max radius {}km at k-ring {}, stopping search", currentRadius, k);
                break;
            }
        }
        
        // Build candidate objects with location data
        List<CandidateHelper> candidates = buildCandidates(
                new ArrayList<>(candidateIds), 
                helperToH3Cell, 
                lat, 
                lng
        );
        
        long duration = System.currentTimeMillis() - startTime;
        log.debug("Found {} candidates in {}ms using H3 k-ring lookup", candidates.size(), duration);
        
        return candidates;
    }
    
    /**
     * Find candidates with skill filtering.
     * 
     * @param lat Task latitude
     * @param lng Task longitude
     * @param maxRadiusKm Maximum search radius
     * @param requiredSkills Required skills for the task
     * @return Filtered list of candidates
     */
    public List<CandidateHelper> findCandidatesWithSkills(
            double lat, 
            double lng, 
            double maxRadiusKm,
            List<String> requiredSkills) {
        
        List<CandidateHelper> allCandidates = findCandidates(lat, lng, maxRadiusKm);
        
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return allCandidates;
        }
        
        // Filter by skills
        return allCandidates.stream()
                .filter(candidate -> hasRequiredSkills(candidate, requiredSkills))
                .collect(Collectors.toList());
    }
    
    /**
     * Find candidates in a specific H3 cell only (fastest lookup).
     * 
     * @param h3Cell H3 cell index
     * @param taskLat Task latitude for distance calculation
     * @param taskLng Task longitude for distance calculation
     * @return List of candidates in the cell
     */
    public List<CandidateHelper> findCandidatesInCell(long h3Cell, double taskLat, double taskLng) {
        long startTime = System.currentTimeMillis();
        
        Set<String> helperIds = locationIndexService.getHelpersInCell(h3Cell);
        
        Map<String, Long> helperToH3Cell = new HashMap<>();
        helperIds.forEach(id -> helperToH3Cell.put(id, h3Cell));
        
        List<CandidateHelper> candidates = buildCandidates(
                new ArrayList<>(helperIds),
                helperToH3Cell,
                taskLat,
                taskLng
        );
        
        long duration = System.currentTimeMillis() - startTime;
        log.debug("Found {} candidates in cell {} in {}ms", candidates.size(), h3Cell, duration);
        
        return candidates;
    }
    
    /**
     * Build candidate helper objects from helper IDs.
     */
    private List<CandidateHelper> buildCandidates(
            List<String> helperIds,
            Map<String, Long> helperToH3Cell,
            double taskLat,
            double taskLng) {
        
        List<CandidateHelper> candidates = new ArrayList<>();
        
        // Batch fetch locations for efficiency
        Map<String, Map<String, String>> locations = 
                locationIndexService.getHelperLocationsBatch(helperIds);
        
        for (String helperId : helperIds) {
            Map<String, String> location = locations.get(helperId);
            if (location == null) {
                continue;
            }
            
            try {
                double helperLat = Double.parseDouble(location.get("lat"));
                double helperLng = Double.parseDouble(location.get("lng"));
                String status = location.get("status");
                
                // Only include available helpers
                if (!"AVAILABLE".equals(status)) {
                    continue;
                }
                
                // Calculate distance
                double distanceKm = h3Service.distanceBetweenPoints(
                        taskLat, taskLng, helperLat, helperLng
                );
                
                // Calculate estimated arrival (assuming 20 km/h average speed)
                double estimatedMinutes = (distanceKm / 20.0) * 60.0;
                
                CandidateHelper candidate = CandidateHelper.builder()
                        .helperId(helperId)
                        .latitude(helperLat)
                        .longitude(helperLng)
                        .h3Cell(helperToH3Cell.getOrDefault(helperId, 0L))
                        .distanceKm(distanceKm)
                        .estimatedArrivalMinutes(estimatedMinutes)
                        .currentStatus(status)
                        .isOnline(true)
                        .build();
                
                candidates.add(candidate);
                
            } catch (Exception e) {
                log.warn("Failed to build candidate for helper {}: {}", helperId, e.getMessage());
            }
        }
        
        return candidates;
    }
    
    /**
     * Check if candidate has required skills.
     * This is a placeholder - in production, fetch from cached profile.
     */
    private boolean hasRequiredSkills(CandidateHelper candidate, List<String> requiredSkills) {
        // TODO: Implement skill matching using cached profile data
        // For now, return true to allow all candidates
        return true;
    }
    
    /**
     * Estimate search radius for a given k-ring value.
     * At resolution 9, each hexagon is ~170m edge length.
     */
    private double estimateRadiusForK(int k) {
        // Resolution 9: ~170m edge, ~0.5km diameter
        // k-ring radius roughly = k * hex diameter
        double hexDiameterKm = 0.5;
        return k * hexDiameterKm * 1.5; // 1.5x factor for diagonal coverage
    }
    
    /**
     * Get the k-ring level that covers a given radius.
     * 
     * @param radiusKm Desired radius in km
     * @return k-ring level needed
     */
    public int getKRingForRadius(double radiusKm) {
        double hexDiameterKm = 0.5; // Resolution 9
        int k = (int) Math.ceil(radiusKm / (hexDiameterKm * 1.5));
        return Math.min(k, MAX_K_RING);
    }
    
    /**
     * Get H3 cells to search for a given location and radius.
     * 
     * @param lat Center latitude
     * @param lng Center longitude
     * @param radiusKm Search radius
     * @return List of H3 cells to search
     */
    public List<Long> getSearchCells(double lat, double lng, double radiusKm) {
        long centerCell = h3Service.latLngToCell(lat, lng);
        int k = getKRingForRadius(radiusKm);
        return h3Service.gridDisk(centerCell, k);
    }
}
