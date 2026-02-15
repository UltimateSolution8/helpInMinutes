package com.helpinminutes.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO representing the result of a matching operation.
 * Contains the matched helper and matching metadata.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class MatchResult {

    private String taskId;
    private String matchId;
    
    // Match status
    private MatchStatus status;
    private String statusMessage;
    
    // Matched helper
    private String helperId;
    private String helperName;
    private String helperPhone;
    private String helperPhotoUrl;
    private Double helperRating;
    private Integer helperTotalReviews;
    
    // Match details
    private Double matchScore;
    private Double distanceKm;
    private Double estimatedArrivalMinutes;
    private Double estimatedPrice;
    
    // Alternative helpers (if primary declines)
    private List<CandidateHelper> alternativeHelpers;
    
    // Timing
    private Instant matchTime;
    private Instant estimatedArrivalTime;
    private Integer searchRadiusKm;
    private Integer helpersNotified;
    
    // Debug/Metrics
    private Long matchingDurationMs;
    private Integer candidatesFound;
    private Integer candidatesRanked;
    
    public enum MatchStatus {
        MATCHED,           // Successfully matched with helper
        PENDING,           // Waiting for helper response
        NO_HELPERS,        // No helpers available in area
        ALL_DECLINED,      // All helpers declined
        TIMEOUT,           // Matching timed out
        ERROR              // System error during matching
    }
    
    /**
     * Create a successful match result
     */
    public static MatchResult success(String taskId, CandidateHelper helper, Long durationMs) {
        return MatchResult.builder()
                .taskId(taskId)
                .status(MatchStatus.MATCHED)
                .statusMessage("Helper matched successfully")
                .helperId(helper.getHelperId())
                .helperName(helper.getName())
                .matchScore(helper.getTotalScore())
                .distanceKm(helper.getDistanceKm())
                .estimatedArrivalMinutes(helper.getEstimatedArrivalMinutes())
                .matchTime(Instant.now())
                .matchingDurationMs(durationMs)
                .build();
    }
    
    /**
     * Create a failed match result
     */
    public static MatchResult failed(String taskId, MatchStatus status, String message, Long durationMs) {
        return MatchResult.builder()
                .taskId(taskId)
                .status(status)
                .statusMessage(message)
                .matchTime(Instant.now())
                .matchingDurationMs(durationMs)
                .build();
    }
}
