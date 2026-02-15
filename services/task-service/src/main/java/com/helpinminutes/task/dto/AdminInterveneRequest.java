package com.helpinminutes.task.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request DTO for admin intervention in a task")
public class AdminInterveneRequest {

    @NotBlank(message = "Intervention reason is required")
    @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
    @Schema(example = "Investigating payment dispute")
    private String reason;

    @Schema(example = "HOLD_PAYMENT")
    private String action;

    private String internalNotes;

    @Schema(example = "true")
    private Boolean notifyUsers;
}