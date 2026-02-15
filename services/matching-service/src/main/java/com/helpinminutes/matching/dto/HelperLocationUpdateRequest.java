package com.helpinminutes.matching.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for helper location heartbeat/updates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HelperLocationUpdateRequest {

    @NotBlank(message = "Helper ID is required")
    private String helperId;
    
    @NotNull(message = "Latitude is required")
    @Min(value = -90, message = "Latitude must be between -90 and 90")
    @Max(value = 90, message = "Latitude must be between -90 and 90")
    private Double latitude;
    
    @NotNull(message = "Longitude is required")
    @Min(value = -180, message = "Longitude must be between -180 and 180")
    @Max(value = 180, message = "Longitude must be between -180 and 180")
    private Double longitude;
    
    private Double accuracy;  // GPS accuracy in meters
    private Double altitude;
    private Double speed;     // Speed in m/s
    private Double heading;   // Direction in degrees
    
    @NotBlank(message = "Status is required")
    private String status;    // AVAILABLE, BUSY, OFFLINE
    
    // Current task if BUSY
    private String currentTaskId;
    
    // Battery level (for optimization)
    private Integer batteryLevel;
    
    // Device info
    private String deviceId;
    private String appVersion;
    
    // Timestamp of the location fix
    private Instant locationTimestamp;
    
    public Instant getLocationTimestamp() {
        return locationTimestamp != null ? locationTimestamp : Instant.now();
    }
}
