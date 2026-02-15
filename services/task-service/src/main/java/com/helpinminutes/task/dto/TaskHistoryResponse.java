package com.helpinminutes.task.dto;

import com.helpinminutes.task.entity.Task;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response DTO for task history/audit trail")
public class TaskHistoryResponse {

    private List<HistoryEntryDto> entries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryEntryDto {
        
        private UUID id;
        private Task.TaskStatus status;
        private Task.TaskStatus previousStatus;
        private UUID changedBy;
        private String changedByRole;
        private String notes;
        private HistoryMetadataDto metadata;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryMetadataDto {
        
        private String ipAddress;
        private String userAgent;
        private String reason;
        private String location;
    }
}