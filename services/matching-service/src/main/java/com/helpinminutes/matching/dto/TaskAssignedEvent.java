package com.helpinminutes.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for task assignment event published to RabbitMQ.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignedEvent {

    private String eventType = "TASK_ASSIGNED";
    private String taskId;
    private String helperId;
    private String customerId;
    private Instant assignedAt;
    private Double estimatedArrivalMinutes;
    private Double matchScore;
    
    // For audit trail
    private String matchId;
    private Long matchingDurationMs;
    private Integer candidatesConsidered;
}
