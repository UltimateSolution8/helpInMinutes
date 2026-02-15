package com.helpinminutes.matching.service;

import com.helpinminutes.matching.dto.ClaimRequest;
import com.helpinminutes.matching.dto.ClaimResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.concurrent.TimeUnit;

/**
 * Service for atomic task claiming using Redis SETNX.
 * Prevents race conditions when multiple helpers try to claim the same task.
 * 
 * Redis keys:
 * - task:claim:{taskId} - SETNX lock for task claiming
 * - task:claims:{taskId} - Set of all helpers who attempted to claim
 * - task:declined:{taskId} - Set of helpers who declined
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AtomicClaimService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String TASK_CLAIM_PREFIX = "task:claim:";
    private static final String TASK_CLAIMS_PREFIX = "task:claims:";
    private static final String TASK_DECLINED_PREFIX = "task:declined:";
    private static final String TASK_DISPATCH_PREFIX = "task:dispatch:";
    
    // TTL for claim locks (5 minutes)
    private static final long CLAIM_LOCK_TTL_MINUTES = 5;
    // TTL for claim history (24 hours)
    private static final long CLAIM_HISTORY_TTL_HOURS = 24;

    /**
     * Attempt to atomically claim a task.
     * Uses Redis SETNX to ensure only one helper can claim.
     * 
     * @param request Claim request
     * @return Claim response with success/failure status
     */
    public ClaimResponse claimTask(ClaimRequest request) {
        String taskId = request.getTaskId();
        String helperId = request.getHelperId();
        String claimKey = TASK_CLAIM_PREFIX + taskId;
        String claimValue = request.getClaimValue();
        
        try {
            // Use SETNX (set if not exists) for atomic claim
            Boolean claimSuccess = redisTemplate.opsForValue()
                    .setIfAbsent(claimKey, claimValue, CLAIM_LOCK_TTL_MINUTES, TimeUnit.MINUTES);
            
            if (Boolean.TRUE.equals(claimSuccess)) {
                // Successfully claimed
                log.info("Task {} claimed by helper {}", taskId, helperId);
                
                // Record claim attempt
                recordClaimAttempt(taskId, helperId);
                
                return ClaimResponse.success(taskId, helperId);
            } else {
                // Task already claimed
                String existingClaim = redisTemplate.opsForValue().get(claimKey);
                String assignedHelperId = extractHelperIdFromClaim(existingClaim);
                
                log.info("Task {} already claimed by helper {} (attempt by {})", 
                        taskId, assignedHelperId, helperId);
                
                // Record claim attempt anyway for analytics
                recordClaimAttempt(taskId, helperId);
                
                return ClaimResponse.alreadyClaimed(taskId, assignedHelperId);
            }
            
        } catch (Exception e) {
            log.error("Error claiming task {} for helper {}", taskId, helperId, e);
            return ClaimResponse.error("System error during claim: " + e.getMessage());
        }
    }
    
    /**
     * Attempt to claim using Lua script for true atomicity.
     * More reliable under high concurrency.
     * 
     * @param request Claim request
     * @return true if claim successful
     */
    public boolean claimTaskAtomic(ClaimRequest request) {
        String taskId = request.getTaskId();
        String helperId = request.getHelperId();
        String claimKey = TASK_CLAIM_PREFIX + taskId;
        String claimValue = request.getClaimValue();
        
        // Lua script for atomic SETNX + EXPIRE
        String luaScript = 
                "if redis.call('setnx', KEYS[1], ARGV[1]) == 1 then " +
                "    redis.call('expire', KEYS[1], ARGV[2]) " +
                "    return 1 " +
                "else " +
                "    return 0 " +
                "end";
        
        try {
            DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
            redisScript.setScriptText(luaScript);
            redisScript.setResultType(Long.class);
            
            Long result = redisTemplate.execute(
                    redisScript,
                    Collections.singletonList(claimKey),
                    claimValue,
                    String.valueOf(CLAIM_LOCK_TTL_MINUTES * 60)  // TTL in seconds
            );
            
            boolean success = result != null && result == 1;
            
            if (success) {
                log.info("Task {} atomically claimed by helper {}", taskId, helperId);
                recordClaimAttempt(taskId, helperId);
            }
            
            return success;
            
        } catch (Exception e) {
            log.error("Error in atomic claim for task {} by helper {}", taskId, helperId, e);
            return false;
        }
    }
    
    /**
     * Release a task claim (e.g., if helper cancels).
     * 
     * @param taskId Task ID
     * @param helperId Helper ID (must match the claim)
     * @return true if released successfully
     */
    public boolean releaseClaim(String taskId, String helperId) {
        String claimKey = TASK_CLAIM_PREFIX + taskId;
        
        try {
            String existingClaim = redisTemplate.opsForValue().get(claimKey);
            String assignedHelperId = extractHelperIdFromClaim(existingClaim);
            
            if (helperId.equals(assignedHelperId)) {
                redisTemplate.delete(claimKey);
                log.info("Task {} claim released by helper {}", taskId, helperId);
                return true;
            } else {
                log.warn("Cannot release task {}: helper {} doesn't match claim holder {}",
                        taskId, helperId, assignedHelperId);
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error releasing claim for task {} by helper {}", taskId, helperId, e);
            return false;
        }
    }
    
    /**
     * Record a helper declining a task.
     * 
     * @param taskId Task ID
     * @param helperId Helper ID
     */
    public void recordDecline(String taskId, String helperId) {
        try {
            String declinedKey = TASK_DECLINED_PREFIX + taskId;
            redisTemplate.opsForSet().add(declinedKey, helperId);
            redisTemplate.expire(declinedKey, CLAIM_HISTORY_TTL_HOURS, TimeUnit.HOURS);
            
            log.debug("Recorded decline for task {} by helper {}", taskId, helperId);
        } catch (Exception e) {
            log.error("Error recording decline for task {} by helper {}", taskId, helperId, e);
        }
    }
    
    /**
     * Check if a task is available for claiming.
     * 
     * @param taskId Task ID
     * @return true if task is not yet claimed
     */
    public boolean isTaskAvailable(String taskId) {
        String claimKey = TASK_CLAIM_PREFIX + taskId;
        return !Boolean.TRUE.equals(redisTemplate.hasKey(claimKey));
    }
    
    /**
     * Get the helper who claimed a task.
     * 
     * @param taskId Task ID
     * @return Helper ID or null if not claimed
     */
    public String getClaimedHelper(String taskId) {
        String claimKey = TASK_CLAIM_PREFIX + taskId;
        String claimValue = redisTemplate.opsForValue().get(claimKey);
        return extractHelperIdFromClaim(claimValue);
    }
    
    /**
     * Get all helpers who declined a task.
     * 
     * @param taskId Task ID
     * @return Set of helper IDs
     */
    public java.util.Set<String> getDeclinedHelpers(String taskId) {
        try {
            String declinedKey = TASK_DECLINED_PREFIX + taskId;
            java.util.Set<String> declined = redisTemplate.opsForSet().members(declinedKey);
            return declined != null ? declined : java.util.Collections.emptySet();
        } catch (Exception e) {
            log.error("Error getting declined helpers for task {}", taskId, e);
            return java.util.Collections.emptySet();
        }
    }
    
    /**
     * Check if a specific helper declined a task.
     * 
     * @param taskId Task ID
     * @param helperId Helper ID
     * @return true if helper declined
     */
    public boolean hasDeclined(String taskId, String helperId) {
        try {
            String declinedKey = TASK_DECLINED_PREFIX + taskId;
            Boolean isMember = redisTemplate.opsForSet().isMember(declinedKey, helperId);
            return Boolean.TRUE.equals(isMember);
        } catch (Exception e) {
            log.error("Error checking decline status for task {} helper {}", taskId, helperId, e);
            return false;
        }
    }
    
    /**
     * Record that a task was dispatched to helpers.
     * 
     * @param taskId Task ID
     * @param helperIds List of helper IDs dispatched
     */
    public void recordDispatch(String taskId, java.util.List<String> helperIds) {
        try {
            String dispatchKey = TASK_DISPATCH_PREFIX + taskId;
            redisTemplate.opsForSet().add(dispatchKey, helperIds.toArray(new String[0]));
            redisTemplate.expire(dispatchKey, CLAIM_HISTORY_TTL_HOURS, TimeUnit.HOURS);
            
            log.debug("Recorded dispatch for task {} to {} helpers", taskId, helperIds.size());
        } catch (Exception e) {
            log.error("Error recording dispatch for task {}", taskId, e);
        }
    }
    
    /**
     * Get all helpers a task was dispatched to.
     * 
     * @param taskId Task ID
     * @return Set of helper IDs
     */
    public java.util.Set<String> getDispatchedHelpers(String taskId) {
        try {
            String dispatchKey = TASK_DISPATCH_PREFIX + taskId;
            java.util.Set<String> dispatched = redisTemplate.opsForSet().members(dispatchKey);
            return dispatched != null ? dispatched : java.util.Collections.emptySet();
        } catch (Exception e) {
            log.error("Error getting dispatched helpers for task {}", taskId, e);
            return java.util.Collections.emptySet();
        }
    }
    
    /**
     * Clean up all claim-related keys for a task.
     * Call after task is completed/cancelled.
     * 
     * @param taskId Task ID
     */
    public void cleanupTask(String taskId) {
        try {
            redisTemplate.delete(TASK_CLAIM_PREFIX + taskId);
            redisTemplate.delete(TASK_CLAIMS_PREFIX + taskId);
            redisTemplate.delete(TASK_DECLINED_PREFIX + taskId);
            redisTemplate.delete(TASK_DISPATCH_PREFIX + taskId);
            
            log.debug("Cleaned up claim keys for task {}", taskId);
        } catch (Exception e) {
            log.error("Error cleaning up task {}", taskId, e);
        }
    }
    
    /**
     * Record a claim attempt for analytics.
     */
    private void recordClaimAttempt(String taskId, String helperId) {
        try {
            String claimsKey = TASK_CLAIMS_PREFIX + taskId;
            redisTemplate.opsForSet().add(claimsKey, helperId);
            redisTemplate.expire(claimsKey, CLAIM_HISTORY_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("Error recording claim attempt for task {} by helper {}", taskId, helperId, e);
        }
    }
    
    /**
     * Extract helper ID from claim value.
     * Claim value format: {helperId}:{timestamp}
     */
    private String extractHelperIdFromClaim(String claimValue) {
        if (claimValue == null || claimValue.isEmpty()) {
            return null;
        }
        int separatorIndex = claimValue.indexOf(':');
        if (separatorIndex > 0) {
            return claimValue.substring(0, separatorIndex);
        }
        return claimValue;
    }
    
    /**
     * Get claim statistics for a task.
     * 
     * @param taskId Task ID
     * @return Map with claim statistics
     */
    public java.util.Map<String, Object> getClaimStats(String taskId) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        
        try {
            String claimedBy = getClaimedHelper(taskId);
            java.util.Set<String> claimAttempts = redisTemplate.opsForSet()
                    .members(TASK_CLAIMS_PREFIX + taskId);
            java.util.Set<String> declined = getDeclinedHelpers(taskId);
            java.util.Set<String> dispatched = getDispatchedHelpers(taskId);
            
            stats.put("taskId", taskId);
            stats.put("claimedBy", claimedBy);
            stats.put("claimAttempts", claimAttempts != null ? claimAttempts.size() : 0);
            stats.put("declinedCount", declined.size());
            stats.put("dispatchedCount", dispatched.size());
            stats.put("isAvailable", claimedBy == null);
            
        } catch (Exception e) {
            log.error("Error getting claim stats for task {}", taskId, e);
        }
        
        return stats;
    }
}
