package com.helpinminutes.identity.dto;

import com.helpinminutes.identity.entity.HelperProfile;
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
@Schema(description = "KYC status response")
public class KycStatusResponse {

    @Schema(description = "Helper profile ID")
    private UUID helperId;

    @Schema(description = "Current KYC status")
    private String kycStatus;

    @Schema(description = "List of uploaded documents")
    private List<DocumentInfo> documents;

    @Schema(description = "Bank account verification status")
    private Boolean bankAccountVerified;

    @Schema(description = "Rejection reason (if rejected)")
    private String rejectionReason;

    @Schema(description = "Submitted at timestamp")
    private LocalDateTime submittedAt;

    @Schema(description = "Verified at timestamp")
    private LocalDateTime verifiedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Document information")
    public static class DocumentInfo {
        @Schema(description = "Document type")
        private String type;

        @Schema(description = "Document file name")
        private String fileName;

        @Schema(description = "Document URL")
        private String url;

        @Schema(description = "Upload timestamp")
        private LocalDateTime uploadedAt;

        @Schema(description = "Verification status")
        private Boolean isVerified;
    }

    public static KycStatusResponse fromHelperProfile(HelperProfile profile) {
        List<DocumentInfo> documents = profile.getDocuments() != null ? 
                profile.getDocuments().stream()
                        .map(doc -> DocumentInfo.builder()
                                .type(doc.getType())
                                .fileName(doc.getFileName())
                                .url(doc.getUrl())
                                .uploadedAt(doc.getUploadedAt())
                                .isVerified(doc.getIsVerified())
                                .build())
                        .toList() : 
                List.of();

        return KycStatusResponse.builder()
                .helperId(profile.getId())
                .kycStatus(profile.getKycStatus().name())
                .documents(documents)
                .bankAccountVerified(profile.getBankAccount() != null ? 
                        profile.getBankAccount().getIsVerified() : false)
                .submittedAt(profile.getCreatedAt())
                .build();
    }
}
