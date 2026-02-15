package com.helpinminutes.matching.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO for dispatching a task to helpers.
 * Used when sending task offers to ranked helpers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchRequest {

    @NotBlank(message = "Task ID is required")
    private String taskId;
    
    @NotBlank(message = "Customer ID is required")
    private String customerId;
    
    @NotEmpty(message = "At least one helper must be specified")
    private List<String> helperIds;
    
    // Task details for notification
    private String serviceType;
    private String serviceSubtype;
    private Double taskLatitude;
    private Double taskLongitude;
    private String address;
    private String description;
    private Double estimatedPrice;
    
    // Dispatch configuration
    private Integer batchSize;           // How many to notify at once (default: 3)
    private Integer timeoutSeconds;      // How long to wait for response (default: 15)
    private Boolean requireFirstAccept;  // If true, first to accept wins
    private Integer retryAttempts;       // How many times to retry dispatch
    
    // Metadata
    private Instant dispatchTime;
    private String dispatchId;
    
    public Integer getBatchSize() {
        return batchSize != null ? batchSize : 3;
    }
    
    public Integer getTimeoutSeconds() {
        return timeoutSeconds != null ? timeoutSeconds : 15;
    }
    
    public Boolean getRequireFirstAccept() {
        return requireFirstAccept != null ? requireFirstAccept : true;
    }
    
    public Integer getRetryAttempts() {
        return retryAttempts != null ? retryAttempts : 2;
    }
}
