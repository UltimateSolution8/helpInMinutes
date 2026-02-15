package com.helpinminutes.matching.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Service for indexing helper locations using Redis and H3 geospatial indexing.
 * Provides O(1) lookups for helpers by H3 cell.
 * 
 * Redis Data Structures:
 * - SET helpers:h3:{h3_index} - Set of helper IDs in each H3 cell
 * - HASH helper:{helper_id} - Helper location data (lat, lng, h3, last_seen, status)
 * - SET helpers:online - Set of all online helper IDs
 * - HASH helper:profile:{helper_id} - Cached helper profile (rating, skills, etc.)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HelperLocationIndexService {

    private final RedisTemplate<String, String> redisTemplate;
    private final H3Service h3Service;

    private static final String HELPERS_H3_PREFIX = "helpers:h3:";
    private static final String HELPER_PREFIX = "helper:";
    private static final String HELPERS_ONLINE_KEY = "helpers:online";
    private static final String HELPER_PROFILE_PREFIX = "helper:profile:";
    private static final String HELPER_RATINGS_PREFIX = "helper:ratings:";
    
    private static final long HELPER_LOCATION_TTL_MINUTES = 30;
    private static final long HELPER_PROFILE_TTL_HOURS = 24;

    /**
     * Add a helper to the location index.
     * 
     * @param helperId Unique helper identifier
     * @param lat Latitude
     * @param lng Longitude
     * @param status Helper status (AVAILABLE, BUSY, OFFLINE)
     * @return H3 cell index where helper was indexed
     */
    public long addHelper(String helperId, double lat, double lng, String status) {
        try {
            long h3Index = h3Service.latLngToCell(lat, lng);
            String h3Hex = h3Service.h3ToString(h3Index);
            String timestamp = Instant.now().toString();

            // Add to H3 cell set
            String h3Key = HELPERS_H3_PREFIX + h3Hex;
            redisTemplate.opsForSet().add(h3Key, helperId);
            redisTemplate.expire(h3Key, HELPER_LOCATION_TTL_MINUTES, TimeUnit.MINUTES);

            // Store helper location hash
            String helperKey = HELPER_PREFIX + helperId;
            Map<String, String> locationData = new HashMap<>();
            locationData.put("lat", String.valueOf(lat));
            locationData.put("lng", String.valueOf(lng));
            locationData.put("h3", h3Hex);
            locationData.put("last_seen", timestamp);
            locationData.put("status", status);
            
            redisTemplate.opsForHash().putAll(helperKey, locationData);
            redisTemplate.expire(helperKey, HELPER_LOCATION_TTL_MINUTES, TimeUnit.MINUTES);

            // Add to online set if available
            if ("AVAILABLE".equals(status)) {
                redisTemplate.opsForSet().add(HELPERS_ONLINE_KEY, helperId);
            }

            log.debug("Added helper {} to H3 cell {} at {}, {}", helperId, h3Hex, lat, lng);
            return h3Index;
        } catch (Exception e) {
            log.error("Failed to add helper {} to index", helperId, e);
            throw new RuntimeException("Failed to add helper to location index", e);
        }
    }

    /**
     * Remove a helper from the location index.
     * 
     * @param helperId Unique helper identifier
     */
    public void removeHelper(String helperId) {
        try {
            // Get current H3 cell
            String helperKey = HELPER_PREFIX + helperId;
            String h3Hex = (String) redisTemplate.opsForHash().get(helperKey, "h3");

            if (h3Hex != null) {
                // Remove from H3 cell set
                String h3Key = HELPERS_H3_PREFIX + h3Hex;
                redisTemplate.opsForSet().remove(h3Key, helperId);
            }

            // Remove helper hash
            redisTemplate.delete(helperKey);

            // Remove from online set
            redisTemplate.opsForSet().remove(HELPERS_ONLINE_KEY, helperId);

            log.debug("Removed helper {} from location index", helperId);
        } catch (Exception e) {
            log.error("Failed to remove helper {} from index", helperId, e);
            throw new RuntimeException("Failed to remove helper from location index", e);
        }
    }

    /**
     * Update helper location. Efficiently handles cell changes.
     * 
     * @param helperId Unique helper identifier
     * @param lat New latitude
     * @param lng New longitude
     * @param status Helper status
     * @return New H3 cell index
     */
    public long updateLocation(String helperId, double lat, double lng, String status) {
        try {
            String helperKey = HELPER_PREFIX + helperId;
            String oldH3Hex = (String) redisTemplate.opsForHash().get(helperKey, "h3");
            long newH3Index = h3Service.latLngToCell(lat, lng);
            String newH3Hex = h3Service.h3ToString(newH3Index);
            String timestamp = Instant.now().toString();

            // If cell changed, update both sets
            if (oldH3Hex != null && !oldH3Hex.equals(newH3Hex)) {
                String oldH3Key = HELPERS_H3_PREFIX + oldH3Hex;
                redisTemplate.opsForSet().remove(oldH3Key, helperId);
                
                String newH3Key = HELPERS_H3_PREFIX + newH3Hex;
                redisTemplate.opsForSet().add(newH3Key, helperId);
                redisTemplate.expire(newH3Key, HELPER_LOCATION_TTL_MINUTES, TimeUnit.MINUTES);
                
                log.debug("Helper {} moved from H3 cell {} to {}", helperId, oldH3Hex, newH3Hex);
            } else if (oldH3Hex == null) {
                // New helper, add to cell
                String newH3Key = HELPERS_H3_PREFIX + newH3Hex;
                redisTemplate.opsForSet().add(newH3Key, helperId);
                redisTemplate.expire(newH3Key, HELPER_LOCATION_TTL_MINUTES, TimeUnit.MINUTES);
            }

            // Update location hash
            Map<String, String> locationData = new HashMap<>();
            locationData.put("lat", String.valueOf(lat));
            locationData.put("lng", String.valueOf(lng));
            locationData.put("h3", newH3Hex);
            locationData.put("last_seen", timestamp);
            locationData.put("status", status);
            
            redisTemplate.opsForHash().putAll(helperKey, locationData);
            redisTemplate.expire(helperKey, HELPER_LOCATION_TTL_MINUTES, TimeUnit.MINUTES);

            // Update online status
            if ("AVAILABLE".equals(status)) {
                redisTemplate.opsForSet().add(HELPERS_ONLINE_KEY, helperId);
            } else {
                redisTemplate.opsForSet().remove(HELPERS_ONLINE_KEY, helperId);
            }

            return newH3Index;
        } catch (Exception e) {
            log.error("Failed to update location for helper {}", helperId, e);
            throw new RuntimeException("Failed to update helper location", e);
        }
    }

    /**
     * Get all helpers in a specific H3 cell.
     * O(1) operation - no database queries.
     * 
     * @param h3Index H3 cell index
     * @return Set of helper IDs in the cell
     */
    public Set<String> getHelpersInCell(long h3Index) {
        try {
            String h3Hex = h3Service.h3ToString(h3Index);
            String h3Key = HELPERS_H3_PREFIX + h3Hex;
            Set<String> helpers = redisTemplate.opsForSet().members(h3Key);
            return helpers != null ? helpers : Collections.emptySet();
        } catch (Exception e) {
            log.error("Failed to get helpers in H3 cell {}", h3Index, e);
            return Collections.emptySet();
        }
    }

    /**
     * Get helpers in multiple H3 cells (for k-ring searches).
     * Uses Redis pipeline for efficient batch operations.
     * 
     * @param h3Indexes List of H3 cell indices
     * @return Map of cell index to set of helper IDs
     */
    public Map<Long, Set<String>> getHelpersInCells(java.util.List<Long> h3Indexes) {
        try {
            Map<Long, Set<String>> result = new HashMap<>();
            
            for (Long h3Index : h3Indexes) {
                Set<String> helpers = getHelpersInCell(h3Index);
                if (!helpers.isEmpty()) {
                    result.put(h3Index, helpers);
                }
            }
            
            return result;
        } catch (Exception e) {
            log.error("Failed to get helpers in multiple H3 cells", e);
            return Collections.emptyMap();
        }
    }

    /**
     * Get helper location data.
     * 
     * @param helperId Helper identifier
     * @return Map of location data or null if not found
     */
    public Map<String, String> getHelperLocation(String helperId) {
        try {
            String helperKey = HELPER_PREFIX + helperId;
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(helperKey);
            
            if (entries.isEmpty()) {
                return null;
            }
            
            return entries.entrySet().stream()
                    .collect(Collectors.toMap(
                            e -> String.valueOf(e.getKey()),
                            e -> String.valueOf(e.getValue())
                    ));
        } catch (Exception e) {
            log.error("Failed to get location for helper {}", helperId, e);
            return null;
        }
    }

    /**
     * Get multiple helper locations in a batch operation.
     * 
     * @param helperIds List of helper IDs
     * @return Map of helper ID to location data
     */
    public Map<String, Map<String, String>> getHelperLocationsBatch(java.util.List<String> helperIds) {
        try {
            Map<String, Map<String, String>> result = new HashMap<>();
            
            for (String helperId : helperIds) {
                Map<String, String> location = getHelperLocation(helperId);
                if (location != null) {
                    result.put(helperId, location);
                }
            }
            
            return result;
        } catch (Exception e) {
            log.error("Failed to batch get helper locations", e);
            return Collections.emptyMap();
        }
    }

    /**
     * Update helper status without changing location.
     * 
     * @param helperId Helper identifier
     * @param status New status
     */
    public void updateStatus(String helperId, String status) {
        try {
            String helperKey = HELPER_PREFIX + helperId;
            redisTemplate.opsForHash().put(helperKey, "status", status);
            redisTemplate.opsForHash().put(helperKey, "last_seen", Instant.now().toString());

            if ("AVAILABLE".equals(status)) {
                redisTemplate.opsForSet().add(HELPERS_ONLINE_KEY, helperId);
            } else {
                redisTemplate.opsForSet().remove(HELPERS_ONLINE_KEY, helperId);
            }
        } catch (Exception e) {
            log.error("Failed to update status for helper {}", helperId, e);
            throw new RuntimeException("Failed to update helper status", e);
        }
    }

    /**
     * Cache helper profile data (rating, skills, etc.).
     * 
     * @param helperId Helper identifier
     * @param profileData Profile data to cache
     */
    public void cacheHelperProfile(String helperId, Map<String, String> profileData) {
        try {
            String profileKey = HELPER_PROFILE_PREFIX + helperId;
            redisTemplate.opsForHash().putAll(profileKey, profileData);
            redisTemplate.expire(profileKey, HELPER_PROFILE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("Failed to cache profile for helper {}", helperId, e);
        }
    }

    /**
     * Get cached helper profile.
     * 
     * @param helperId Helper identifier
     * @return Profile data or null if not cached
     */
    public Map<String, String> getCachedProfile(String helperId) {
        try {
            String profileKey = HELPER_PROFILE_PREFIX + helperId;
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(profileKey);
            
            if (entries.isEmpty()) {
                return null;
            }
            
            return entries.entrySet().stream()
                    .collect(Collectors.toMap(
                            e -> String.valueOf(e.getKey()),
                            e -> String.valueOf(e.getValue())
                    ));
        } catch (Exception e) {
            log.error("Failed to get cached profile for helper {}", helperId, e);
            return null;
        }
    }

    /**
     * Cache helper rating.
     * 
     * @param helperId Helper identifier
     * @param rating Rating value
     * @param totalReviews Total number of reviews
     */
    public void cacheHelperRating(String helperId, double rating, int totalReviews) {
        try {
            String ratingsKey = HELPER_RATINGS_PREFIX + helperId;
            Map<String, String> ratingData = new HashMap<>();
            ratingData.put("rating", String.valueOf(rating));
            ratingData.put("total_reviews", String.valueOf(totalReviews));
            ratingData.put("cached_at", Instant.now().toString());
            
            redisTemplate.opsForHash().putAll(ratingsKey, ratingData);
            redisTemplate.expire(ratingsKey, HELPER_PROFILE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("Failed to cache rating for helper {}", helperId, e);
        }
    }

    /**
     * Get cached helper rating.
     * 
     * @param helperId Helper identifier
     * @return Array of [rating, totalReviews] or null if not cached
     */
    public double[] getCachedRating(String helperId) {
        try {
            String ratingsKey = HELPER_RATINGS_PREFIX + helperId;
            String rating = (String) redisTemplate.opsForHash().get(ratingsKey, "rating");
            String totalReviews = (String) redisTemplate.opsForHash().get(ratingsKey, "total_reviews");
            
            if (rating != null && totalReviews != null) {
                return new double[]{Double.parseDouble(rating), Double.parseDouble(totalReviews)};
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to get cached rating for helper {}", helperId, e);
            return null;
        }
    }

    /**
     * Get count of online helpers.
     * 
     * @return Number of online helpers
     */
    public long getOnlineHelperCount() {
        try {
            Long count = redisTemplate.opsForSet().size(HELPERS_ONLINE_KEY);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Failed to get online helper count", e);
            return 0;
        }
    }

    /**
     * Get all online helper IDs.
     * 
     * @return Set of online helper IDs
     */
    public Set<String> getOnlineHelpers() {
        try {
            Set<String> helpers = redisTemplate.opsForSet().members(HELPERS_ONLINE_KEY);
            return helpers != null ? helpers : Collections.emptySet();
        } catch (Exception e) {
            log.error("Failed to get online helpers", e);
            return Collections.emptySet();
        }
    }

    /**
     * Check if a helper is online and available.
     * 
     * @param helperId Helper identifier
     * @return true if helper is online
     */
    public boolean isHelperOnline(String helperId) {
        try {
            Boolean isMember = redisTemplate.opsForSet().isMember(HELPERS_ONLINE_KEY, helperId);
            return Boolean.TRUE.equals(isMember);
        } catch (Exception e) {
            log.error("Failed to check if helper {} is online", helperId, e);
            return false;
        }
    }

    /**
     * Remove stale helper entries (helpers not seen for a while).
     * Should be called periodically by a scheduled job.
     */
    public void cleanupStaleHelpers() {
        try {
            Set<String> onlineHelpers = getOnlineHelpers();
            Instant cutoff = Instant.now().minusSeconds(HELPER_LOCATION_TTL_MINUTES * 60);
            
            for (String helperId : onlineHelpers) {
                Map<String, String> location = getHelperLocation(helperId);
                if (location != null) {
                    String lastSeen = location.get("last_seen");
                    if (lastSeen != null) {
                        Instant lastSeenTime = Instant.parse(lastSeen);
                        if (lastSeenTime.isBefore(cutoff)) {
                            removeHelper(helperId);
                            log.debug("Removed stale helper {}", helperId);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to cleanup stale helpers", e);
        }
    }
}
