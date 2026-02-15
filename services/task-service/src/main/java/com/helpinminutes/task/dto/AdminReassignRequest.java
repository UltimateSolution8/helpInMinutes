package com.helpinminutes.task.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request DTO for admin reassigning a task")
public class AdminReassignRequest {

    @NotNull(message = "New helper ID is required")
    @Schema(example = "550e8400-e29b-41d4-a716-446655440003")
    private UUID newHelperId;

    @Schema(example = "Previous helper unavailable")
    private String reason;

    @Schema(example = "true")
    private Boolean notifyImmediately;

    @Schema(example = "50.00")
    private Double previousHelperCompensation;
}