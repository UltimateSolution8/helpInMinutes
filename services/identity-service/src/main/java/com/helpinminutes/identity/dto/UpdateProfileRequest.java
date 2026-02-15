package com.helpinminutes.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Update user profile request")
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Schema(description = "User full name", example = "John Doe")
    private String name;

    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be 10-15 digits")
    @Schema(description = "User phone number", example = "9876543210")
    private String phone;

    @Schema(description = "Profile picture URL", example = "https://storage.helpinminutes.com/profiles/user123.jpg")
    private String profilePictureUrl;
}
