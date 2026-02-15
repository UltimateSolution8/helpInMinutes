package com.helpinminutes.task.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request DTO for creating a new task")
public class CreateTaskRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    @Schema(example = "Fix leaking kitchen sink")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    @Schema(example = "The kitchen sink has been leaking for 2 days...")
    private String description;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    @Schema(example = "12.9716")
    private Double lat;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    @Schema(example = "77.5946")
    private Double lng;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    @Schema(example = "123 Main St, Koramangala, Bangalore")
    private String address;

    @Size(max = 100, message = "City cannot exceed 100 characters")
    @Schema(example = "Bangalore")
    private String city;

    @NotBlank(message = "Sub-skill is required")
    @Size(max = 100, message = "Sub-skill cannot exceed 100 characters")
    @Schema(example = "plumbing-sink-repair")
    private String subSkill;

    @Schema(description = "Scheduled time for the task (optional)")
    private LocalDateTime scheduledAt;

    @Schema(description = "List of photo URLs attached to the task")
    private List<String> photos;

    @Schema(description = "Voice note URL attached to the task")
    private String voiceNoteUrl;

    @Schema(description = "Task metadata")
    private TaskMetadataDto metadata;

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