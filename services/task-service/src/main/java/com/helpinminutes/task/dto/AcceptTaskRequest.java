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
@Schema(description = "Request DTO for helper accepting a task")
public class AcceptTaskRequest {

    @NotNull(message = "Helper ID is required")
    @Schema(example = "550e8400-e29b-41d4-a716-446655440002")
    private UUID helperId;

    @Schema(description = "Estimated time to arrival in minutes", example = "15")
    private Integer estimatedArrivalMinutes;

    @Schema(description = "Optional note from helper", example = "I'm nearby and can be there in 10 minutes")
    private String note;
}