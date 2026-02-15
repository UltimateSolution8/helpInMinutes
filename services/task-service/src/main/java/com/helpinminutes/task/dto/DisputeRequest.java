package com.helpinminutes.task.dto;

import com.helpinminutes.task.entity.Dispute;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
@Schema(description = "Request DTO for raising a dispute")
public class DisputeRequest {

    @NotNull(message = "Dispute reason is required")
    @Schema(example = "HELPER_NO_SHOW")
    private Dispute.DisputeReason reason;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    @Schema(example = "Helper never arrived at the location...")
    private String description;

    private List<String> evidence;

    @Size(max = 1000, message = "Requested resolution cannot exceed 1000 characters")
    @Schema(example = "Full refund and assign new helper")
    private String requestedResolution;
}