package com.helpinminutes.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User signup request for buyer registration")
public class SignupRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Schema(description = "User full name", example = "John Doe", required = true)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Schema(description = "User email address", example = "john.doe@example.com", required = true)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
            message = "Password must contain at least one digit, one lowercase, one uppercase, and one special character")
    @Schema(description = "User password (min 8 chars, must include uppercase, lowercase, number, special char)", 
            example = "SecurePass123!", required = true)
    private String password;

    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be 10-15 digits")
    @Schema(description = "User phone number (optional)", example = "9876543210")
    private String phone;

    @Schema(description = "Device ID for tracking", example = "device-123-abc")
    private String deviceId;

    @Schema(description = "Device information", example = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    private String deviceInfo;
}
