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
@Schema(description = "Request DTO for cancelling a task")
public class CancelTaskRequest {

    @NotBlank(message = "Cancellation reason is required")
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    @Schema(example = "Found another helper")
    private String reason;

    @Schema(example = "BUYER_CHANGED_MIND")
    private String category;

    @Schema(example = "false")
    private Boolean waiveFee;
}