package com.helpinminutes.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskDto {
    
    private UUID id;
    private UUID customerId;
    private UUID helperId;
    private String title;
    private String description;
    private TaskCategory category;
    private TaskStatus status;
    private TaskPriority priority;
    private BigDecimal budget;
    private BigDecimal finalPrice;
    private LocationDto location;
    private String h3Index;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private List<String> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public enum TaskCategory {
        PLUMBING,
        ELECTRICAL,
        CLEANING,
        MOVING,
        DELIVERY,
        HANDYMAN,
        TECH_SUPPORT,
        TUTORING,
        PET_CARE,
        OTHER
    }
    
    public enum TaskStatus {
        PENDING,
        MATCHING,
        ASSIGNED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        DISPUTED
    }
    
    public enum TaskPriority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationDto {
        private Double latitude;
        private Double longitude;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private String country;
    }
}