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
@Schema(description = "Response DTO for paginated task list")
public class TaskListResponse {

    private List<TaskSummaryDto> tasks;
    private PaginationInfoDto pagination;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskSummaryDto {
        
        private UUID id;
        private String title;
        private String description;
        private String buyerName;
        private String helperName;
        private LocationDto location;
        private String subSkillName;
        private String categoryName;
        private Task.TaskStatus status;
        private BigDecimal price;
        private Boolean hasPhotos;
        private Boolean hasVoiceNote;
        private LocalDateTime scheduledAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationDto {
        
        private Double lat;
        private Double lng;
        private String city;
        private Double distanceKm;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationInfoDto {
        
        @Schema(example = "0")
        private Integer page;
        
        @Schema(example = "20")
        private Integer size;
        
        @Schema(example = "150")
        private Long totalElements;
        
        @Schema(example = "8")
        private Integer totalPages;
        
        private Boolean first;
        private Boolean last;
        private Boolean hasNext;
        private Boolean hasPrevious;
    }
}