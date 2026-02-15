package com.helpinminutes.matching.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * DTO for incoming match requests.
 * Contains all task details needed to find and rank suitable helpers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchRequest {

    @NotBlank(message = "Task ID is required")
    private String taskId;
    
    @NotBlank(message = "Customer ID is required")
    private String customerId;
    
    @NotBlank(message = "Service type is required")
    private String serviceType;
    
    private String serviceSubtype;
    
    // Task location
    @NotNull(message = "Task latitude is required")
    private Double taskLatitude;
    
    @NotNull(message = "Task longitude is required")
    private Double taskLongitude;
    
    private String address;
    private String city;
    private String pincode;
    
    // Task details
    private String description;
    private List<String> requiredSkills;
    private Map<String, Object> taskAttributes;
    
    // Scheduling
    private Instant scheduledTime;  // null for immediate
    private Integer estimatedDurationMinutes;
    
    // Matching preferences
    private Integer maxHelpersToNotify;  // default: 5
    private Double maxSearchRadiusKm;    // default: 10
    private Integer maxWaitTimeSeconds;  // default: 15
    
    // Pricing
    private Double estimatedPrice;
    private String priceCurrency;
    
    // Priority
    private Integer priority;  // 1-5, higher is more urgent
    
    // Metadata
    private Instant requestTime;
    private String requestSource;  // API, SCHEDULER, etc.
    
    /**
     * Get default values for optional fields
     */
    public Integer getMaxHelpersToNotify() {
        return maxHelpersToNotify != null ? maxHelpersToNotify : 5;
    }
    
    public Double getMaxSearchRadiusKm() {
        return maxSearchRadiusKm != null ? maxSearchRadiusKm : 10.0;
    }
    
    public Integer getMaxWaitTimeSeconds() {
        return maxWaitTimeSeconds != null ? maxWaitTimeSeconds : 15;
    }
    
    public Integer getPriority() {
        return priority != null ? priority : 3;
    }
}
