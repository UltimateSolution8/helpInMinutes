package com.helpinminutes.identity.service;

import com.helpinminutes.identity.dto.AuthResponse;
import com.helpinminutes.identity.dto.GoogleAuthRequest;
import com.helpinminutes.identity.entity.RefreshToken;
import com.helpinminutes.identity.entity.User;
import com.helpinminutes.identity.repository.UserRepository;
import com.helpinminutes.identity.security.JwtTokenProvider;
import com.helpinminutes.shared.events.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;
    private final JwtTokenProvider tokenProvider;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.events:helpinminutes.events}")
    private String eventsExchange;

    @Value("${rabbitmq.routing-key.user-registered:user.registered}")
    private String userRegisteredRoutingKey;

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

    /**
     * Authenticate or register a user using Google OAuth.
     * Note: This is a placeholder implementation. In production, you would:
     * 1. Verify the Google ID token using Google's API
     * 2. Extract user information from the verified token
     * 3. Create or update the user account
     */
    @Transactional
    public AuthResponse authenticate(GoogleAuthRequest request, String ipAddress, String userAgent, String requestId) {
        // TODO: Implement Google ID token verification
        // For now, this is a placeholder that shows the expected flow
        
        log.info("Google OAuth authentication requested");
        
        // Placeholder: In real implementation, verify token with Google
        // GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(...)
        // GoogleIdToken idToken = verifier.verify(request.getIdToken());
        
        // For now, throw an exception to indicate this needs proper implementation
        throw new UnsupportedOperationException(
                "Google OAuth integration requires proper Google API setup. " +
                "Please configure GOOGLE_OAUTH_CLIENT_ID and implement token verification.");
    }

    /**
     * Find or create a user based on Google profile information.
     */
    @Transactional
    protected AuthResponse findOrCreateUser(String email, String name, String profilePictureUrl, 
                                           String googleId, GoogleAuthRequest request,
                                           String ipAddress, String userAgent, String requestId) {
        
        Optional<User> existingUser = userRepository.findByEmail(email);
        boolean isNewUser = false;
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            // Update profile picture if not set
            if (user.getProfilePictureUrl() == null && profilePictureUrl != null) {
                user.setProfilePictureUrl(profilePictureUrl);
                user = userRepository.save(user);
            }
            log.info("Existing user logged in via Google: {}", user.getId());
        } else {
            // Create new user
            isNewUser = true;
            user = createNewUser(email, name, profilePictureUrl, request);
            log.info("New user created via Google OAuth: {}", user.getId());
        }

        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, ipAddress, userAgent, request.getDeviceId());

        // Log the login/signup
        if (isNewUser) {
            auditService.logSignup(email, user.getId(), user.getRole().name(), ipAddress, userAgent, requestId);
        } else {
            auditService.logLoginSuccess(email, user.getId(), ipAddress, userAgent, request.getDeviceId(), requestId);
        }

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationTime() / 1000)
                .user(AuthResponse.UserInfo.fromUser(user))
                .isNewUser(isNewUser)
                .build();
    }

    @Transactional
    protected User createNewUser(String email, String name, String profilePictureUrl, GoogleAuthRequest request) {
        // Determine role (default to BUYER if not specified)
        User.UserRole role = User.UserRole.BUYER;
        if (request.getRole() != null) {
            try {
                role = User.UserRole.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role specified: {}, defaulting to BUYER", request.getRole());
            }
        }

        User user = User.builder()
                .email(email)
                .name(name)
                .profilePictureUrl(profilePictureUrl)
                .role(role)
                .kycStatus(User.KycStatus.PENDING)
                .isActive(true)
                .isEmailVerified(true) // Google accounts are email verified
                .isPhoneVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // Publish user registered event
        UserRegisteredEvent event = new UserRegisteredEvent(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getName(),
                savedUser.getRole().name(),
                savedUser.getPhone()
        );

        try {
            rabbitTemplate.convertAndSend(eventsExchange, userRegisteredRoutingKey, event);
            log.info("Published user registered event for Google user: {}", savedUser.getId());
        } catch (Exception e) {
            log.error("Failed to publish user registered event", e);
        }

        return savedUser;
    }
}
