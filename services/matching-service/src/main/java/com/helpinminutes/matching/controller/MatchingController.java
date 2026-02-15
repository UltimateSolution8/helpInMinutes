package com.helpinminutes.matching.controller;

import com.helpinminutes.matching.dto.*;
import com.helpinminutes.matching.service.MatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for matching operations.
 * Provides internal API for manual matching triggers and match management.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/matching")
@RequiredArgsConstructor
@Tag(name = "Matching", description = "Task matching and helper assignment APIs")
public class MatchingController {

    private final MatchingService matchingService;

    /**
     * Manually trigger matching for a task.
     * Used for admin operations or retry scenarios.
     */
    @PostMapping("/match")
    @Operation(summary = "Trigger matching for a task", description = "Manually start the matching process for a task")
    public ResponseEntity<MatchResult> triggerMatching(@Valid @RequestBody MatchRequest request) {
        log.info("Manual matching triggered for task {}", request.getTaskId());
        
        MatchResult result = matchingService.matchTask(request);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Retry matching with expanded search radius.
     */
    @PostMapping("/match/{taskId}/retry")
    @Operation(summary = "Retry matching with expanded radius", description = "Retry matching for a task with expanded search radius")
    public ResponseEntity<MatchResult> retryMatching(
            @PathVariable String taskId,
            @RequestParam(defaultValue = "20.0") double expandedRadiusKm,
            @RequestBody MatchRequest request) {
        
        log.info("Retry matching triggered for task {} with radius {}km", taskId, expandedRadiusKm);
        
        request.setTaskId(taskId);
        MatchResult result = matchingService.retryMatch(request, expandedRadiusKm);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Helper claims a task.
     */
    @PostMapping("/claim")
    @Operation(summary = "Claim a task", description = "Helper claims a task atomically")
    public ResponseEntity<ClaimResponse> claimTask(@Valid @RequestBody ClaimRequest request) {
        log.info("Claim request for task {} by helper {}", 
                request.getTaskId(), request.getHelperId());
        
        ClaimResponse response = matchingService.handleClaim(request);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Helper declines a task.
     */
    @PostMapping("/decline")
    @Operation(summary = "Decline a task", description = "Helper declines a task offer")
    public ResponseEntity<Void> declineTask(@Valid @RequestBody HelperDeclineRequest request) {
        log.info("Decline request for task {} by helper {}", 
                request.getTaskId(), request.getHelperId());
        
        matchingService.handleDecline(request);
        
        return ResponseEntity.ok().build();
    }

    /**
     * Check task availability.
     */
    @PostMapping("/available")
    @Operation(summary = "Check task availability", description = "Check if a task is still available for claiming")
    public ResponseEntity<Map<String, Object>> checkAvailability(@RequestBody Map<String, String> request) {
        String taskId = request.get("taskId");
        
        if (taskId == null || taskId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "taskId is required"));
        }
        
        boolean available = matchingService.isTaskAvailable(taskId);
        Map<String, Object> stats = matchingService.getMatchStats(taskId);
        
        return ResponseEntity.ok(Map.of(
                "taskId", taskId,
                "available", available,
                "stats", stats
        ));
    }

    /**
     * Get match statistics for a task.
     */
    @GetMapping("/stats/{taskId}")
    @Operation(summary = "Get match statistics", description = "Get matching statistics for a task")
    public ResponseEntity<Map<String, Object>> getMatchStats(@PathVariable String taskId) {
        Map<String, Object> stats = matchingService.getMatchStats(taskId);
        return ResponseEntity.ok(stats);
    }
}
