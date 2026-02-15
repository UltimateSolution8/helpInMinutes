package com.helpinminutes.matching.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for helper declining a task.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HelperDeclineRequest {

    @NotBlank(message = "Task ID is required")
    private String taskId;
    
    @NotBlank(message = "Helper ID is required")
    private String helperId;
    
    private String reason;  // Optional decline reason
    private DeclineReason declineReason;
    
    private Instant declinedAt;
    
    public enum DeclineReason {
        TOO_FAR,
        BUSY,
        NOT_INTERESTED,
        SKILL_MISMATCH,
        PRICE_TOO_LOW,
        OTHER
    }
    
    public Instant getDeclinedAt() {
        return declinedAt != null ? declinedAt : Instant.now();
    }
}
