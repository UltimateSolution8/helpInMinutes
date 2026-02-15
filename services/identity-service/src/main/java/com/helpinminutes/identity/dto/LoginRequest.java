package com.helpinminutes.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Login request with email and password")
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Schema(description = "User email address", example = "user@example.com", required = true)
    private String email;

    @NotBlank(message = "Password is required")
    @Schema(description = "User password", example = "SecurePass123!", required = true)
    private String password;

    @Schema(description = "Device ID for tracking", example = "device-123-abc")
    private String deviceId;

    @Schema(description = "Device information", example = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    private String deviceInfo;
}
