package com.helpinminutes.identity.dto;

import com.helpinminutes.identity.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User profile response")
public class UserProfileResponse {

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

    @Schema(description = "Whether account is active")
    private Boolean isActive;

    @Schema(description = "Whether email is verified")
    private Boolean isEmailVerified;

    @Schema(description = "Whether phone is verified")
    private Boolean isPhoneVerified;

    @Schema(description = "KYC status")
    private String kycStatus;

    @Schema(description = "Account creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;

    @Schema(description = "Helper profile (if user is a helper)")
    private HelperProfileInfo helperProfile;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Helper profile information")
    public static class HelperProfileInfo {
        @Schema(description = "Helper profile ID")
        private UUID id;

        @Schema(description = "List of skills")
        private List<String> skills;

        @Schema(description = "KYC status")
        private String kycStatus;

        @Schema(description = "Whether helper is online")
        private Boolean isOnline;

        @Schema(description = "Helper rating")
        private Double rating;

        @Schema(description = "Total reviews")
        private Integer totalReviews;

        @Schema(description = "Total tasks completed")
        private Integer totalTasksCompleted;

        @Schema(description = "Helper bio")
        private String bio;

        @Schema(description = "Hourly rate")
        private java.math.BigDecimal hourlyRate;
    }

    public static UserProfileResponse fromUser(User user) {
        UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .profilePictureUrl(user.getProfilePictureUrl())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .isPhoneVerified(user.getIsPhoneVerified())
                .kycStatus(user.getKycStatus().name())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());

        if (user.getHelperProfile() != null) {
            builder.helperProfile(HelperProfileInfo.builder()
                    .id(user.getHelperProfile().getId())
                    .skills(user.getHelperProfile().getSkills())
                    .kycStatus(user.getHelperProfile().getKycStatus().name())
                    .isOnline(user.getHelperProfile().getIsOnline())
                    .rating(user.getHelperProfile().getRating() != null ? 
                            user.getHelperProfile().getRating().doubleValue() : null)
                    .totalReviews(user.getHelperProfile().getTotalReviews())
                    .totalTasksCompleted(user.getHelperProfile().getTotalTasksCompleted())
                    .bio(user.getHelperProfile().getBio())
                    .hourlyRate(user.getHelperProfile().getHourlyRate())
                    .build());
        }

        return builder.build();
    }
}
