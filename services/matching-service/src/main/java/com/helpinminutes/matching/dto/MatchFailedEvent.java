package com.helpinminutes.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for match failure event published to RabbitMQ.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchFailedEvent {

    private String eventType = "MATCH_FAILED";
    private String taskId;
    private String customerId;
    private String failureReason;
    private MatchFailureType failureType;
    private Instant failedAt;
    private Long matchingDurationMs;
    private Integer searchRadiusKm;
    private Integer helpersAvailable;
    private Integer helpersNotified;
    
    public enum MatchFailureType {
        NO_HELPERS_AVAILABLE,
        ALL_HELPERS_DECLINED,
        MATCHING_TIMEOUT,
        SYSTEM_ERROR,
        TASK_CANCELLED
    }
}
