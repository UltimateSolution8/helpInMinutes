package com.helpinminutes.identity.controller;

import com.helpinminutes.identity.dto.*;
import com.helpinminutes.identity.security.UserPrincipal;
import com.helpinminutes.identity.service.AuthService;
import com.helpinminutes.identity.service.HelperService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

    private final AuthService authService;
    private final HelperService helperService;

    @PostMapping("/login")
    @Operation(summary = "Login with email and password", description = "Authenticate user and return JWT tokens")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful", 
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "429", description = "Too many login attempts")
    })
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        AuthResponse response = authService.login(request, ipAddress, userAgent, requestId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    @Operation(summary = "Register a new buyer account", description = "Create a new buyer account with email and password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or email already exists"),
            @ApiResponse(responseCode = "409", description = "Email or phone already registered")
    })
    public ResponseEntity<AuthResponse> signup(
            @Valid @RequestBody SignupRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        AuthResponse response = authService.signup(request, ipAddress, userAgent, requestId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    @Operation(summary = "Login with Google OAuth", description = "Authenticate user using Google OAuth2")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid Google token"),
            @ApiResponse(responseCode = "401", description = "Google authentication failed")
    })
    public ResponseEntity<AuthResponse> googleAuth(
            @Valid @RequestBody GoogleAuthRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        AuthResponse response = authService.googleAuth(request, ipAddress, userAgent, requestId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Get a new access token using a valid refresh token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        AuthResponse response = authService.refreshToken(request, ipAddress, userAgent, requestId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Revoke refresh token and logout user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout successful"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) RefreshTokenRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        String refreshToken = request != null ? request.getRefreshToken() : null;
        authService.logout(refreshToken, userPrincipal.getId(), ipAddress, userAgent, requestId);
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout-all")
    @Operation(summary = "Logout from all devices", description = "Revoke all refresh tokens for the user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logged out from all devices"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> logoutAllDevices(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        authService.logoutAllDevices(userPrincipal.getId(), ipAddress, userAgent, requestId);
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/helpers/register")
    @Operation(summary = "Register a new helper", description = "Create a new helper account with KYC information")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Helper registration successful",
                    content = @Content(schema = @Schema(implementation = UserProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "409", description = "Email or phone already registered")
    })
    public ResponseEntity<UserProfileResponse> registerHelper(
            @Valid @RequestBody HelperRegistrationRequest request,
            @Parameter(hidden = true) HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestId = httpRequest.getHeader("X-Request-ID");

        UserProfileResponse response = helperService.registerHelper(request, ipAddress, userAgent, requestId);
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
