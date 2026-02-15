package com.helpinminutes.task.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request DTO when helper arrives at customer location")
public class HelperArrivedRequest {

    @NotNull(message = "Latitude is required")
    @Schema(example = "17.3850", description = "Current latitude of helper")
    private Double lat;

    @NotNull(message = "Longitude is required")
    @Schema(example = "78.4867", description = "Current longitude of helper")
    private Double lng;

    @Schema(example = "Arrived at the location, waiting for customer", description = "Optional note")
    private String notes;
}
