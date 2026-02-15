package com.helpinminutes.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Google OAuth authentication request")
public class GoogleAuthRequest {

    @NotBlank(message = "Google ID token is required")
    @Schema(description = "Google ID token from Google Sign-In", required = true)
    private String idToken;

    @Schema(description = "Role to assign if new user (BUYER or HELPER)", example = "BUYER")
    private String role;

    @Schema(description = "Device ID for tracking", example = "device-123-abc")
    private String deviceId;

    @Schema(description = "Device information", example = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    private String deviceInfo;
}
