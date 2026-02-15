package com.helpinminutes.task.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
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
@Schema(description = "Request DTO for updating task details (only allowed in CREATED or MATCHING status)")
public class UpdateTaskRequest {

    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    @Schema(example = "Fix leaking kitchen sink urgently")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    private LocalDateTime scheduledAt;
    private List<String> photos;
    private String voiceNoteUrl;
    private TaskMetadataDto metadata;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskMetadataDto {
        
        @Schema(example = "URGENT")
        private String urgency;
        
        private Integer estimatedDuration;
        private String specialRequirements;
        private Boolean requiresTools;
        private Boolean requiresMaterials;
    }
}