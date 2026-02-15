package com.helpinminutes.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for task claim response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimResponse {

    private boolean success;
    private String message;
    private ClaimStatus status;
    
    // If claim successful
    private String taskId;
    private String helperId;
    private Instant claimedAt;
    private String claimId;
    
    // If claim failed
    private String assignedToHelperId;  // If already claimed by another helper
    private Long timeUntilExpiry;       // If task is still available, when does offer expire
    
    public enum ClaimStatus {
        CLAIMED,           // Successfully claimed
        ALREADY_CLAIMED,   // Task already claimed by another helper
        EXPIRED,           // Task offer expired
        INVALID_TASK,      // Task doesn't exist or invalid state
        NOT_AUTHORIZED,    // Helper not authorized to claim
        ERROR              // System error
    }
    
    public static ClaimResponse success(String taskId, String helperId) {
        return ClaimResponse.builder()
                .success(true)
                .status(ClaimStatus.CLAIMED)
                .message("Task claimed successfully")
                .taskId(taskId)
                .helperId(helperId)
                .claimedAt(Instant.now())
                .build();
    }
    
    public static ClaimResponse alreadyClaimed(String taskId, String assignedToHelperId) {
        return ClaimResponse.builder()
                .success(false)
                .status(ClaimStatus.ALREADY_CLAIMED)
                .message("Task already claimed by another helper")
                .taskId(taskId)
                .assignedToHelperId(assignedToHelperId)
                .build();
    }
    
    public static ClaimResponse error(String message) {
        return ClaimResponse.builder()
                .success(false)
                .status(ClaimStatus.ERROR)
                .message(message)
                .build();
    }
}
