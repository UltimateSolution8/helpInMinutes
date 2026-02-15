package com.helpinminutes.matching.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for helper claiming a task.
 * Used for atomic task claiming to prevent double assignment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRequest {

    @NotBlank(message = "Task ID is required")
    private String taskId;
    
    @NotBlank(message = "Helper ID is required")
    private String helperId;
    
    // Optional estimated arrival time from helper
    private Integer estimatedArrivalMinutes;
    private String notes;
    
    // Metadata
    private Instant claimTime;
    private String deviceId;
    private String appVersion;
    
    /**
     * Generate a unique claim key for Redis SETNX operation
     */
    public String getClaimKey() {
        return String.format("task:claim:%s", taskId);
    }
    
    /**
     * Generate claim value (helper ID with timestamp)
     */
    public String getClaimValue() {
        return String.format("%s:%d", helperId, Instant.now().toEpochMilli());
    }
}
