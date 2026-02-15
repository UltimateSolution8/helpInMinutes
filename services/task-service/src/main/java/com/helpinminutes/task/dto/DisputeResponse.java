package com.helpinminutes.task.dto;

import com.helpinminutes.task.entity.Dispute;
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
@Schema(description = "Response DTO for dispute details")
public class DisputeResponse {

    private UUID id;
    private UUID taskId;
    private UUID createdBy;
    private String createdByName;
    private Dispute.DisputeStatus status;
    private Dispute.DisputeReason reason;
    private String description;
    private List<String> evidence;
    private String requestedResolution;
    private String resolutionNotes;
    private Dispute.Resolution resolution;
    private UUID resolvedBy;
    private String resolvedByName;
    private LocalDateTime resolvedAt;
    private Double refundAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}