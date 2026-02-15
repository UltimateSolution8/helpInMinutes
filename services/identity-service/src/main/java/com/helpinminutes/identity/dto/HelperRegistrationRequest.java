package com.helpinminutes.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Helper registration request with KYC information")
public class HelperRegistrationRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Schema(description = "Helper full name", example = "John Doe", required = true)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Schema(description = "Helper email address", example = "helper@example.com", required = true)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
            message = "Password must contain at least one digit, one lowercase, one uppercase, and one special character")
    @Schema(description = "User password (min 8 chars, must include uppercase, lowercase, number, special char)",
            example = "SecurePass123!", required = true)
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be 10-15 digits")
    @Schema(description = "Helper phone number", example = "9876543210", required = true)
    private String phone;

    @NotEmpty(message = "At least one skill is required")
    @Schema(description = "List of skills", example = "[\"PLUMBING\", \"ELECTRICAL\"]", required = true)
    private List<String> skills;

    @Schema(description = "Helper bio/description", example = "Experienced plumber with 5+ years of experience")
    private String bio;

    @DecimalMin(value = "0.0", inclusive = false, message = "Hourly rate must be greater than 0")
    @Schema(description = "Hourly rate in INR", example = "500.00")
    private BigDecimal hourlyRate;

    // KYC Documents
    @Schema(description = "Aadhaar number (12 digits)", example = "123456789012")
    private String aadhaarNumber;

    @Schema(description = "PAN number (10 characters)", example = "ABCDE1234F")
    private String panNumber;

    @Schema(description = "Bank account number")
    private String bankAccountNumber;

    @Schema(description = "Bank IFSC code")
    private String bankIfscCode;

    @Schema(description = "Bank name")
    private String bankName;

    @Schema(description = "Account holder name (if different from user name)")
    private String accountHolderName;

    @Schema(description = "Device ID for tracking", example = "device-123-abc")
    private String deviceId;

    @Schema(description = "Device information", example = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    private String deviceInfo;
}
