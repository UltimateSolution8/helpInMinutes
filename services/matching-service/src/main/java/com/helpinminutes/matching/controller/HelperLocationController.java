package com.helpinminutes.matching.controller;

import com.helpinminutes.matching.dto.HelperLocationUpdateRequest;
import com.helpinminutes.matching.service.HelperLocationIndexService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST controller for helper location operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/matching/location")
@RequiredArgsConstructor
@Tag(name = "Helper Location", description = "Helper location tracking and management APIs")
public class HelperLocationController {

    private final HelperLocationIndexService locationIndexService;

    /**
     * Helper location heartbeat/update.
     * Called by helper app to update location and status.
     */
    @PostMapping("/heartbeat")
    @Operation(summary = "Update helper location", description = "Heartbeat endpoint for helpers to update their location")
    public ResponseEntity<Map<String, Object>> updateLocation(@Valid @RequestBody HelperLocationUpdateRequest request) {
        log.debug("Location update from helper {}: {}, {}", 
                request.getHelperId(), request.getLatitude(), request.getLongitude());
        
        long h3Cell = locationIndexService.updateLocation(
                request.getHelperId(),
                request.getLatitude(),
                request.getLongitude(),
                request.getStatus()
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("helperId", request.getHelperId());
        response.put("status", "updated");
        response.put("h3Cell", Long.toHexString(h3Cell));
        response.put("timestamp", request.getLocationTimestamp().toString());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Register a new helper as online.
     */
    @PostMapping("/online")
    @Operation(summary = "Register helper as online", description = "Register a helper as available for matching")
    public ResponseEntity<Map<String, Object>> registerOnline(@Valid @RequestBody HelperLocationUpdateRequest request) {
        log.info("Helper {} coming online at {}, {}", 
                request.getHelperId(), request.getLatitude(), request.getLongitude());
        
        long h3Cell = locationIndexService.addHelper(
                request.getHelperId(),
                request.getLatitude(),
                request.getLongitude(),
                "AVAILABLE"
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("helperId", request.getHelperId());
        response.put("status", "online");
        response.put("h3Cell", Long.toHexString(h3Cell));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Mark helper as offline.
     */
    @PostMapping("/offline")
    @Operation(summary = "Mark helper offline", description = "Mark a helper as offline")
    public ResponseEntity<Map<String, Object>> markOffline(@RequestBody Map<String, String> request) {
        String helperId = request.get("helperId");
        
        if (helperId == null || helperId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "helperId is required"));
        }
        
        log.info("Helper {} going offline", helperId);
        
        locationIndexService.removeHelper(helperId);
        
        return ResponseEntity.ok(Map.of(
                "helperId", helperId,
                "status", "offline"
        ));
    }

    /**
     * Update helper status.
     */
    @PostMapping("/status")
    @Operation(summary = "Update helper status", description = "Update helper availability status")
    public ResponseEntity<Map<String, Object>> updateStatus(@RequestBody Map<String, String> request) {
        String helperId = request.get("helperId");
        String status = request.get("status");
        
        if (helperId == null || status == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "helperId and status are required"));
        }
        
        log.debug("Helper {} status update: {}", helperId, status);
        
        locationIndexService.updateStatus(helperId, status);
        
        return ResponseEntity.ok(Map.of(
                "helperId", helperId,
                "status", status
        ));
    }

    /**
     * Get helper's current location.
     */
    @GetMapping("/{helperId}")
    @Operation(summary = "Get helper location", description = "Get current location of a helper")
    public ResponseEntity<Map<String, Object>> getHelperLocation(@PathVariable String helperId) {
        Map<String, String> location = locationIndexService.getHelperLocation(helperId);
        
        if (location == null) {
            return ResponseEntity.notFound().build();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("helperId", helperId);
        response.putAll(location);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get nearby helpers (admin/debug endpoint).
     */
    @GetMapping("/helpers/nearby")
    @Operation(summary = "Get nearby helpers", description = "Get helpers near a location (admin only)")
    public ResponseEntity<Map<String, Object>> getNearbyHelpers(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radiusKm) {
        
        log.debug("Finding helpers near {}, {} within {}km", lat, lng, radiusKm);
        
        // Get all online helpers
        Set<String> onlineHelpers = locationIndexService.getOnlineHelpers();
        
        List<Map<String, Object>> nearbyHelpers = new ArrayList<>();
        
        for (String helperId : onlineHelpers) {
            Map<String, String> location = locationIndexService.getHelperLocation(helperId);
            if (location != null) {
                try {
                    double helperLat = Double.parseDouble(location.get("lat"));
                    double helperLng = Double.parseDouble(location.get("lng"));
                    
                    // Calculate distance (simplified)
                    double distance = calculateDistance(lat, lng, helperLat, helperLng);
                    
                    if (distance <= radiusKm) {
                        Map<String, Object> helperInfo = new HashMap<>();
                        helperInfo.put("helperId", helperId);
                        helperInfo.put("latitude", helperLat);
                        helperInfo.put("longitude", helperLng);
                        helperInfo.put("distanceKm", distance);
                        helperInfo.put("status", location.get("status"));
                        helperInfo.put("lastSeen", location.get("last_seen"));
                        nearbyHelpers.add(helperInfo);
                    }
                } catch (Exception e) {
                    log.warn("Error processing helper {} location", helperId, e);
                }
            }
        }
        
        // Sort by distance
        nearbyHelpers.sort(Comparator.comparingDouble(h -> (Double) h.get("distanceKm")));
        
        Map<String, Object> response = new HashMap<>();
        response.put("center", Map.of("lat", lat, "lng", lng));
        response.put("radiusKm", radiusKm);
        response.put("totalOnline", onlineHelpers.size());
        response.put("nearbyCount", nearbyHelpers.size());
        response.put("helpers", nearbyHelpers);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get online helper count.
     */
    @GetMapping("/stats/online-count")
    @Operation(summary = "Get online helper count", description = "Get count of currently online helpers")
    public ResponseEntity<Map<String, Object>> getOnlineCount() {
        long count = locationIndexService.getOnlineHelperCount();
        
        return ResponseEntity.ok(Map.of(
                "onlineCount", count,
                "timestamp", new Date().toString()
        ));
    }

    /**
     * Batch update helper locations (for bulk operations).
     */
    @PostMapping("/batch")
    @Operation(summary = "Batch update locations", description = "Update multiple helper locations at once")
    public ResponseEntity<Map<String, Object>> batchUpdateLocations(
            @RequestBody List<HelperLocationUpdateRequest> requests) {
        
        log.info("Batch updating {} helper locations", requests.size());
        
        int successCount = 0;
        List<String> failedHelpers = new ArrayList<>();
        
        for (HelperLocationUpdateRequest request : requests) {
            try {
                locationIndexService.updateLocation(
                        request.getHelperId(),
                        request.getLatitude(),
                        request.getLongitude(),
                        request.getStatus()
                );
                successCount++;
            } catch (Exception e) {
                log.error("Failed to update location for helper {}", request.getHelperId(), e);
                failedHelpers.add(request.getHelperId());
            }
        }
        
        return ResponseEntity.ok(Map.of(
                "totalReceived", requests.size(),
                "successCount", successCount,
                "failedCount", failedHelpers.size(),
                "failedHelpers", failedHelpers
        ));
    }

    /**
     * Simplified distance calculation using Haversine formula.
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // Earth's radius in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}
