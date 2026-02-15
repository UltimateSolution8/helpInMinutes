package com.helpinminutes.identity.controller;

import com.helpinminutes.identity.dto.UpdateProfileRequest;
import com.helpinminutes.identity.dto.UserProfileResponse;
import com.helpinminutes.identity.security.UserPrincipal;
import com.helpinminutes.identity.service.UserService;
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

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Users", description = "User profile management endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Retrieve the profile of the currently authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        UserProfileResponse response = userService.getUserProfile(userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current user profile", description = "Update the profile of the currently authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "409", description = "Phone number already in use")
    })
    public ResponseEntity<UserProfileResponse> updateCurrentUser(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        UserProfileResponse response = userService.updateProfile(
                userPrincipal.getId(), request, ipAddress, userAgent, requestId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    @Operation(summary = "Deactivate current user account", description = "Soft delete the current user account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account deactivated successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> deactivateAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        userService.deactivateAccount(userPrincipal.getId(), ipAddress, userAgent, requestId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/activate")
    @Operation(summary = "Reactivate user account", description = "Reactivate a previously deactivated account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account activated successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> activateAccount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        userService.activateAccount(userPrincipal.getId(), ipAddress, userAgent, requestId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user by ID", description = "Retrieve a user's profile by their ID (Admin only)")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserProfileResponse> getUserById(
            @Parameter(description = "User ID", required = true) @PathVariable String userId) {
        
        UserProfileResponse response = userService.getUserProfile(java.util.UUID.fromString(userId));
        return ResponseEntity.ok(response);
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
