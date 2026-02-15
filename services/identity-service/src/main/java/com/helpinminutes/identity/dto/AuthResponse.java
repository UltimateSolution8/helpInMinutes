package com.helpinminutes.identity.dto;

import com.helpinminutes.identity.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Authentication response with tokens and user info")
public class AuthResponse {

    @Schema(description = "JWT access token")
    private String accessToken;

    @Schema(description = "JWT refresh token")
    private String refreshToken;

    @Schema(description = "Token type (Bearer)")
    @Builder.Default
    private String tokenType = "Bearer";

    @Schema(description = "Access token expiration time in seconds")
    private Long expiresIn;

    @Schema(description = "User information")
    private UserInfo user;

    @Schema(description = "Whether the user is new (first time Google login)")
    private Boolean isNewUser;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "User information in auth response")
    public static class UserInfo {
        @Schema(description = "User ID")
        private UUID id;

        @Schema(description = "User email")
        private String email;

        @Schema(description = "User name")
        private String name;

        @Schema(description = "User role")
        private String role;

        @Schema(description = "User phone number")
        private String phone;

        @Schema(description = "Profile picture URL")
        private String profilePictureUrl;

        @Schema(description = "Whether email is verified")
        private Boolean isEmailVerified;

        @Schema(description = "Whether phone is verified")
        private Boolean isPhoneVerified;

        @Schema(description = "KYC status")
        private String kycStatus;

        @Schema(description = "Account creation timestamp")
        private Instant createdAt;

        public static UserInfo fromUser(User user) {
            return UserInfo.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole().name())
                    .phone(user.getPhone())
                    .profilePictureUrl(user.getProfilePictureUrl())
                    .isEmailVerified(user.getIsEmailVerified())
                    .isPhoneVerified(user.getIsPhoneVerified())
                    .kycStatus(user.getKycStatus().name())
                    .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toInstant(java.time.ZoneOffset.UTC) : null)
                    .build();
        }
    }
}
