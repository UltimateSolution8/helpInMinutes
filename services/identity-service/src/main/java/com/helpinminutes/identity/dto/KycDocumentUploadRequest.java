package com.helpinminutes.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "KYC document upload request")
public class KycDocumentUploadRequest {

    @NotBlank(message = "Document type is required")
    @Pattern(regexp = "^(AADHAAR|PAN|DRIVING_LICENSE|PASSPORT|VOTER_ID)$",
            message = "Document type must be one of: AADHAAR, PAN, DRIVING_LICENSE, PASSPORT, VOTER_ID")
    @Schema(description = "Type of document", example = "AADHAAR", required = true,
            allowableValues = {"AADHAAR", "PAN", "DRIVING_LICENSE", "PASSPORT", "VOTER_ID"})
    private String documentType;

    @Schema(description = "Document number (if applicable)", example = "123456789012")
    private String documentNumber;

    @Schema(description = "Document file name", example = "aadhaar_front.jpg")
    private String fileName;

    @Schema(description = "Document file URL after upload", example = "https://storage.helpinminutes.com/docs/aadhaar_123.jpg")
    private String documentUrl;

    @Schema(description = "Base64 encoded document content (for direct upload)")
    private String base64Content;

    @Schema(description = "Document side (front/back for some documents)", example = "front",
            allowableValues = {"front", "back", "full"})
    private String documentSide;
}
