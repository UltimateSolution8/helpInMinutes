package com.helpinminutes.matching.service;

import com.helpinminutes.matching.algorithm.CandidateFinder;
import com.helpinminutes.matching.algorithm.HelperRanker;
import com.helpinminutes.matching.dto.*;
import com.helpinminutes.matching.service.MatchDispatcher.DispatchResult;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Main matching orchestration service.
 * Coordinates candidate finding, ranking, dispatching, and claiming.
 * 
 * Performance target: 300ms p95 for matching operation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final CandidateFinder candidateFinder;
    private final HelperRanker helperRanker;
    private final MatchDispatcher matchDispatcher;
    private final AtomicClaimService claimService;
    private final RabbitTemplate rabbitTemplate;
    private final MeterRegistry meterRegistry;

    @Value("${app.rabbitmq.exchange.events:events.exchange}")
    private String eventsExchange;

    @Value("${matching.timeout.ms:300}")
    private int matchingTimeoutMs;

    @Value("${matching.max-helpers-to-notify:5}")
    private int maxHelpersToNotify;

    @Value("${matching.dispatch-timeout-seconds:15}")
    private int dispatchTimeoutSeconds;

    /**
     * Main matching entry point.
     * Finds, ranks, and dispatches to helpers for a task.
     * 
     * @param request Match request
     * @return Match result
     */
    public MatchResult matchTask(MatchRequest request) {
        long startTime = System.currentTimeMillis();
        String taskId = request.getTaskId();
        String matchId = UUID.randomUUID().toString();
        
        log.info("Starting matching for task {} (matchId: {})", taskId, matchId);
        
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            // Step 1: Find candidates using H3 k-ring lookup
            List<CandidateHelper> candidates = findCandidates(request);
            
            if (candidates.isEmpty()) {
                long duration = System.currentTimeMillis() - startTime;
                log.warn("No candidates found for task {} in {}ms", taskId, duration);
                publishMatchFailedEvent(request, MatchFailedEvent.MatchFailureType.NO_HELPERS_AVAILABLE, 
                        "No helpers available in search area", duration);
                return MatchResult.failed(taskId, MatchResult.MatchStatus.NO_HELPERS, 
                        "No helpers available in your area", duration);
            }
            
            // Step 2: Rank candidates using multi-factor scoring
            List<CandidateHelper> rankedCandidates = rankCandidates(candidates, request);
            
            if (rankedCandidates.isEmpty()) {
                long duration = System.currentTimeMillis() - startTime;
                log.warn("All candidates filtered out for task {} in {}ms", taskId, duration);
                publishMatchFailedEvent(request, MatchFailedEvent.MatchFailureType.NO_HELPERS_AVAILABLE,
                        "No suitable helpers found", duration);
                return MatchResult.failed(taskId, MatchResult.MatchStatus.NO_HELPERS,
                        "No suitable helpers found", duration);
            }
            
            // Step 3: Dispatch to top helpers
            int helpersToNotify = Math.min(request.getMaxHelpersToNotify(), maxHelpersToNotify);
            List<CandidateHelper> topCandidates = helperRanker.getTopCandidates(rankedCandidates, helpersToNotify);
            
            List<String> helperIds = topCandidates.stream()
                    .map(CandidateHelper::getHelperId)
                    .toList();
            
            DispatchRequest dispatchRequest = DispatchRequest.builder()
                    .taskId(taskId)
                    .customerId(request.getCustomerId())
                    .helperIds(helperIds)
                    .serviceType(request.getServiceType())
                    .serviceSubtype(request.getServiceSubtype())
                    .taskLatitude(request.getTaskLatitude())
                    .taskLongitude(request.getTaskLongitude())
                    .address(request.getAddress())
                    .description(request.getDescription())
                    .estimatedPrice(request.getEstimatedPrice())
                    .batchSize(3)
                    .timeoutSeconds(request.getMaxWaitTimeSeconds())
                    .dispatchTime(Instant.now())
                    .dispatchId(UUID.randomUUID().toString())
                    .build();
            
            // Step 4: Dispatch and wait for claim
            String claimedHelperId = dispatchAndWait(dispatchRequest);
            
            long duration = System.currentTimeMillis() - startTime;
            sample.stop(meterRegistry.timer("matching.duration", 
                    "status", claimedHelperId != null ? "success" : "timeout"));
            
            if (claimedHelperId != null) {
                // Find the claimed helper in candidates
                CandidateHelper matchedHelper = topCandidates.stream()
                        .filter(c -> c.getHelperId().equals(claimedHelperId))
                        .findFirst()
                        .orElse(null);
                
                if (matchedHelper == null) {
                    // Helper claimed but not in our top list (edge case)
                    matchedHelper = CandidateHelper.builder()
                            .helperId(claimedHelperId)
                            .build();
                }
                
                // Publish success event
                publishTaskAssignedEvent(request, matchedHelper, matchId, duration, rankedCandidates.size());
                
                log.info("Task {} matched with helper {} in {}ms", taskId, claimedHelperId, duration);
                
                return MatchResult.success(taskId, matchedHelper, duration)
                        .toBuilder()
                        .matchId(matchId)
                        .helpersNotified(helperIds.size())
                        .candidatesFound(candidates.size())
                        .candidatesRanked(rankedCandidates.size())
                        .alternativeHelpers(topCandidates.size() > 1 ? 
                                topCandidates.subList(1, topCandidates.size()) : List.of())
                        .build();
                
            } else {
                // Timeout - no helper claimed
                log.warn("Task {} matching timed out after {}ms", taskId, duration);
                
                // Check if all declined
                if (matchDispatcher.allHelpersDeclined(taskId)) {
                    publishMatchFailedEvent(request, MatchFailedEvent.MatchFailureType.ALL_HELPERS_DECLINED,
                            "All helpers declined the task", duration);
                    return MatchResult.failed(taskId, MatchResult.MatchStatus.ALL_DECLINED,
                            "All helpers are currently busy", duration);
                }
                
                publishMatchFailedEvent(request, MatchFailedEvent.MatchFailureType.MATCHING_TIMEOUT,
                        "No helper responded in time", duration);
                return MatchResult.failed(taskId, MatchResult.MatchStatus.TIMEOUT,
                        "No helper responded in time. Please try again.", duration);
            }
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Error during matching for task {}", taskId, e);
            sample.stop(meterRegistry.timer("matching.duration", "status", "error"));
            
            publishMatchFailedEvent(request, MatchFailedEvent.MatchFailureType.SYSTEM_ERROR,
                    "System error: " + e.getMessage(), duration);
            return MatchResult.failed(taskId, MatchResult.MatchStatus.ERROR,
                    "Matching service error", duration);
        }
    }
    
    /**
     * Find candidates using H3 k-ring lookup.
     */
    private List<CandidateHelper> findCandidates(MatchRequest request) {
        long start = System.currentTimeMillis();
        
        List<CandidateHelper> candidates = candidateFinder.findCandidates(
                request.getTaskLatitude(),
                request.getTaskLongitude(),
                request.getMaxSearchRadiusKm()
        );
        
        long duration = System.currentTimeMillis() - start;
        meterRegistry.timer("matching.findCandidates").record(duration, TimeUnit.MILLISECONDS);
        
        log.debug("Found {} candidates in {}ms for task {}", candidates.size(), duration, request.getTaskId());
        return candidates;
    }
    
    /**
     * Rank candidates using multi-factor scoring.
     */
    private List<CandidateHelper> rankCandidates(List<CandidateHelper> candidates, MatchRequest request) {
        long start = System.currentTimeMillis();
        
        List<CandidateHelper> ranked = helperRanker.rankCandidates(candidates, request);
        
        long duration = System.currentTimeMillis() - start;
        meterRegistry.timer("matching.rankCandidates").record(duration, TimeUnit.MILLISECONDS);
        
        log.debug("Ranked {} candidates in {}ms for task {}", ranked.size(), duration, request.getTaskId());
        return ranked;
    }
    
    /**
     * Dispatch to helpers and wait for first claim.
     */
    private String dispatchAndWait(DispatchRequest dispatchRequest) {
        try {
            CompletableFuture<String> future = matchDispatcher.dispatchAndWait(dispatchRequest);
            return future.get(dispatchRequest.getTimeoutSeconds() + 5, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error during dispatch and wait for task {}", dispatchRequest.getTaskId(), e);
            return null;
        }
    }
    
    /**
     * Handle a helper claiming a task.
     */
    public ClaimResponse handleClaim(ClaimRequest request) {
        log.info("Processing claim request for task {} by helper {}", 
                request.getTaskId(), request.getHelperId());
        
        ClaimResponse response = claimService.claimTask(request);
        
        meterRegistry.counter("matching.claims", 
                "status", response.isSuccess() ? "success" : "failed").increment();
        
        return response;
    }
    
    /**
     * Handle a helper declining a task.
     */
    public void handleDecline(HelperDeclineRequest request) {
        log.info("Processing decline for task {} by helper {}", 
                request.getTaskId(), request.getHelperId());
        
        matchDispatcher.handleDecline(request);
        
        meterRegistry.counter("matching.declines", 
                "reason", request.getDeclineReason() != null ? 
                        request.getDeclineReason().name() : "UNKNOWN").increment();
    }
    
    /**
     * Check if a task is available for claiming.
     */
    public boolean isTaskAvailable(String taskId) {
        return claimService.isTaskAvailable(taskId);
    }
    
    /**
     * Get match statistics for a task.
     */
    public java.util.Map<String, Object> getMatchStats(String taskId) {
        return claimService.getClaimStats(taskId);
    }
    
    /**
     * Retry matching for a task with expanded radius.
     */
    public MatchResult retryMatch(MatchRequest request, double expandedRadiusKm) {
        log.info("Retrying match for task {} with expanded radius {}km", 
                request.getTaskId(), expandedRadiusKm);
        
        // Update request with expanded radius
        request.setMaxSearchRadiusKm(expandedRadiusKm);
        request.setMaxHelpersToNotify(request.getMaxHelpersToNotify() + 3);
        
        return matchTask(request);
    }
    
    /**
     * Publish task assigned event.
     */
    private void publishTaskAssignedEvent(MatchRequest request, CandidateHelper helper, 
            String matchId, long durationMs, int candidatesConsidered) {
        try {
            TaskAssignedEvent event = TaskAssignedEvent.builder()
                    .taskId(request.getTaskId())
                    .helperId(helper.getHelperId())
                    .customerId(request.getCustomerId())
                    .assignedAt(Instant.now())
                    .estimatedArrivalMinutes(helper.getEstimatedArrivalMinutes())
                    .matchScore(helper.getTotalScore())
                    .matchId(matchId)
                    .matchingDurationMs(durationMs)
                    .candidatesConsidered(candidatesConsidered)
                    .build();
            
            rabbitTemplate.convertAndSend(eventsExchange, "task.assigned", event);
            log.debug("Published TaskAssignedEvent for task {}", request.getTaskId());
            
        } catch (Exception e) {
            log.error("Failed to publish TaskAssignedEvent for task {}", request.getTaskId(), e);
        }
    }
    
    /**
     * Publish match failed event.
     */
    private void publishMatchFailedEvent(MatchRequest request, MatchFailedEvent.MatchFailureType failureType,
            String reason, long durationMs) {
        try {
            MatchFailedEvent event = MatchFailedEvent.builder()
                    .taskId(request.getTaskId())
                    .customerId(request.getCustomerId())
                    .failureType(failureType)
                    .failureReason(reason)
                    .failedAt(Instant.now())
                    .matchingDurationMs(durationMs)
                    .searchRadiusKm(request.getMaxSearchRadiusKm().intValue())
                    .build();
            
            rabbitTemplate.convertAndSend(eventsExchange, "match.failed", event);
            log.debug("Published MatchFailedEvent for task {}", request.getTaskId());
            
        } catch (Exception e) {
            log.error("Failed to publish MatchFailedEvent for task {}", request.getTaskId(), e);
        }
    }
}
