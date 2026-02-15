package com.helpinminutes.identity.controller;

import com.helpinminutes.identity.dto.*;
import com.helpinminutes.identity.security.UserPrincipal;
import com.helpinminutes.identity.service.HelperService;
import com.helpinminutes.identity.service.KycService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/helpers")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Helpers", description = "Helper profile and KYC management endpoints")
public class HelperController {

    private final HelperService helperService;
    private final KycService kycService;

    @GetMapping("/me")
    @Operation(summary = "Get current helper profile", description = "Retrieve the profile of the currently authenticated helper")
    @PreAuthorize("hasRole('HELPER') or hasRole('ADMIN')")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Helper or Admin only")
    })
    public ResponseEntity<UserProfileResponse> getCurrentHelperProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        UserProfileResponse response = helperService.getHelperProfileByUserId(userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    @Operation(summary = "Update current helper profile", description = "Update the profile of the currently authenticated helper")
    @PreAuthorize("hasRole('HELPER') or hasRole('ADMIN')")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Helper or Admin only")
    })
    public ResponseEntity<UserProfileResponse> updateCurrentHelperProfile(
            @Valid @RequestBody HelperRegistrationRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        UserProfileResponse response = helperService.updateHelperProfile(
                userPrincipal.getId(), request, ipAddress, userAgent, requestId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get helper by ID", description = "Retrieve a helper's profile by their ID")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
            @ApiResponse(responseCode = "404", description = "Helper not found")
    })
    public ResponseEntity<UserProfileResponse> getHelperById(
            @Parameter(description = "Helper profile ID", required = true) @PathVariable UUID id) {
        
        UserProfileResponse response = helperService.getHelperProfile(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/kyc/status")
    @Operation(summary = "Get KYC status", description = "Retrieve the KYC status and documents for a helper")
    @PreAuthorize("hasRole('HELPER') or hasRole('ADMIN')")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "KYC status retrieved successfully",
                    content = @Content(schema = @Schema(implementation = KycStatusResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Helper not found")
    })
    public ResponseEntity<KycStatusResponse> getKycStatus(
            @Parameter(description = "Helper profile ID", required = true) @PathVariable UUID id) {
        
        KycStatusResponse response = kycService.getKycStatus(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/kyc/upload")
    @Operation(summary = "Upload KYC document", description = "Upload a KYC document for a helper")
    @PreAuthorize("hasRole('HELPER') or hasRole('ADMIN')")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Document uploaded successfully",
                    content = @Content(schema = @Schema(implementation = KycStatusResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Helper not found")
    })
    public ResponseEntity<KycStatusResponse> uploadKycDocument(
            @Parameter(description = "Helper profile ID", required = true) @PathVariable UUID id,
            @Valid @RequestBody KycDocumentUploadRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        KycStatusResponse response = kycService.uploadDocument(id, request, ipAddress, userAgent, requestId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/kyc/verify")
    @Operation(summary = "Verify KYC (Admin only)", description = "Update KYC status for a helper (Admin only)")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "KYC status updated successfully",
                    content = @Content(schema = @Schema(implementation = KycStatusResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
            @ApiResponse(responseCode = "404", description = "Helper not found")
    })
    public ResponseEntity<KycStatusResponse> verifyKyc(
            @Parameter(description = "Helper profile ID", required = true) @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        com.helpinminutes.shared.enums.KycStatus newStatus = 
                com.helpinminutes.shared.enums.KycStatus.valueOf(status);

        KycStatusResponse response = kycService.updateKycStatus(
                id, newStatus, reason, adminPrincipal.getId(), ipAddress, userAgent, requestId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/online")
    @Operation(summary = "Update online status", description = "Update the online status and location of a helper")
    @PreAuthorize("hasRole('HELPER') or hasRole('ADMIN')")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status updated successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<Void> updateOnlineStatus(
            @Parameter(description = "Helper profile ID", required = true) @PathVariable UUID id,
            @RequestParam boolean isOnline,
            @RequestParam(required = false) String h3Index,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        helperService.updateOnlineStatus(id, isOnline, h3Index, lat, lng, ipAddress, userAgent, requestId);
        return ResponseEntity.ok().build();
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
