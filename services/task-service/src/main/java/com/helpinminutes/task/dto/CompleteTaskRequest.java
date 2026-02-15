package com.helpinminutes.task.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request DTO for marking a task as complete")
public class CompleteTaskRequest {

    @NotBlank(message = "Completion code is required")
    @Size(min = 4, max = 10, message = "Completion code must be between 4 and 10 characters")
    @Schema(example = "123456")
    private String completionCode;

    private String notes;
    private List<String> completionPhotos;

    @Schema(example = "45")
    private Integer actualDurationMinutes;

    @Schema(example = "0.00")
    private Double additionalCharges;

    private String additionalChargesReason;
}