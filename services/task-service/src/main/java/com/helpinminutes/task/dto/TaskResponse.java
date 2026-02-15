package com.helpinminutes.task.dto;

import com.helpinminutes.task.entity.Task;
import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Response DTO containing full task details")
public class TaskResponse {

    @Schema(example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(example = "Fix leaking kitchen sink")
    private String title;

    @Schema(example = "The kitchen sink has been leaking for 2 days...")
    private String description;

    private UserInfoDto buyer;
    private UserInfoDto helper;

    @Schema(example = "12.9716")
    private Double lat;

    @Schema(example = "77.5946")
    private Double lng;

    private String h3Index;
    private String address;
    private String city;
    private String subSkill;
    private String subSkillName;
    private CategoryInfoDto category;

    @Schema(example = "MATCHING")
    private Task.TaskStatus status;

    private BigDecimal price;
    private BigDecimal platformFee;
    private BigDecimal helperAmount;
    private LocalDateTime scheduledAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private UUID cancelledBy;
    private List<String> photos;
    private String voiceNoteUrl;
    private TaskMetadataDto metadata;
    private Boolean hasDispute;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfoDto {
        
        @Schema(example = "550e8400-e29b-41d4-a716-446655440001")
        private UUID id;
        
        @Schema(example = "John Doe")
        private String name;
        
        @Schema(example = "+91-9876543210")
        private String phone;
        
        @Schema(example = "4.8")
        private Double rating;
        
        @Schema(example = "42")
        private Integer completedTasks;
        
        private String profilePictureUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryInfoDto {
        
        private UUID id;
        
        @Schema(example = "Home Repairs")
        private String name;
        
        @Schema(example = "home-repairs")
        private String slug;
        
        private String iconUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskMetadataDto {
        
        @Schema(example = "HIGH")
        private String urgency;
        
        @Schema(example = "60")
        private Integer estimatedDuration;
        
        @Schema(example = "Need to bring own tools")
        private String specialRequirements;
        
        @Schema(example = "true")
        private Boolean requiresTools;
        
        @Schema(example = "false")
        private Boolean requiresMaterials;
    }
}