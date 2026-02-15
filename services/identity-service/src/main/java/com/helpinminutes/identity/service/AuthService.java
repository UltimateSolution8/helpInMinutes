package com.helpinminutes.identity.service;

import com.helpinminutes.identity.dto.*;
import com.helpinminutes.identity.entity.RefreshToken;
import com.helpinminutes.identity.entity.User;
import com.helpinminutes.identity.repository.UserRepository;
import com.helpinminutes.identity.security.JwtTokenProvider;
import com.helpinminutes.identity.security.UserPrincipal;
import com.helpinminutes.shared.events.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final RabbitTemplate rabbitTemplate;
    private final StringRedisTemplate redisTemplate;

    @Value("${rabbitmq.exchange.events:helpinminutes.events}")
    private String eventsExchange;

    @Value("${rabbitmq.routing-key.user-registered:user.registered}")
    private String userRegisteredRoutingKey;

    private static final String LOGIN_ATTEMPTS_KEY = "login:attempts:";
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long LOGIN_ATTEMPTS_WINDOW_MINUTES = 15;

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent, String requestId) {
        // Check rate limiting
        String rateLimitKey = LOGIN_ATTEMPTS_KEY + request.getEmail() + ":" + ipAddress;
        String attemptsStr = redisTemplate.opsForValue().get(rateLimitKey);
        int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;

        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            auditService.logLoginFailure(request.getEmail(), "Too many login attempts", ipAddress, userAgent, requestId);
            throw new RuntimeException("Too many failed login attempts. Please try again later.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Reset login attempts on success
            redisTemplate.delete(rateLimitKey);

            // Generate tokens
            String accessToken = tokenProvider.generateAccessToken(userPrincipal);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                    getUserFromPrincipal(userPrincipal), ipAddress, userAgent, request.getDeviceId());

            // Log successful login
            auditService.logLoginSuccess(request.getEmail(), userPrincipal.getId(), ipAddress, userAgent, 
                    request.getDeviceId(), requestId);

            User user = getUserFromPrincipal(userPrincipal);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .tokenType("Bearer")
                    .expiresIn(tokenProvider.getExpirationTime() / 1000)
                    .user(AuthResponse.UserInfo.fromUser(user))
                    .isNewUser(false)
                    .build();

        } catch (BadCredentialsException e) {
            // Increment login attempts
            redisTemplate.opsForValue().increment(rateLimitKey);
            redisTemplate.expire(rateLimitKey, LOGIN_ATTEMPTS_WINDOW_MINUTES, TimeUnit.MINUTES);

            auditService.logLoginFailure(request.getEmail(), "Invalid credentials", ipAddress, userAgent, requestId);
            throw new RuntimeException("Invalid email or password");
        }
    }

    @Transactional
    public AuthResponse signup(SignupRequest request, String ipAddress, String userAgent, String requestId) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Check if phone already exists
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone number already registered");
        }

        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.UserRole.BUYER)
                .kycStatus(User.KycStatus.PENDING)
                .isActive(true)
                .isEmailVerified(false)
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
            log.info("Published user registered event for user: {}", savedUser.getId());
        } catch (Exception e) {
            log.error("Failed to publish user registered event", e);
        }

        // Log audit event
        auditService.logSignup(request.getEmail(), savedUser.getId(), "BUYER", ipAddress, userAgent, requestId);

        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(savedUser.getId(), savedUser.getEmail(), 
                savedUser.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser, ipAddress, userAgent, 
                request.getDeviceId());

        log.info("User registered successfully: {}", savedUser.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationTime() / 1000)
                .user(AuthResponse.UserInfo.fromUser(savedUser))
                .isNewUser(true)
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, String ipAddress, String userAgent, String requestId) {
        RefreshToken refreshToken = refreshTokenService.findValidToken(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired refresh token"));

        // Verify expiration
        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();

        // Generate new access token
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());

        // Log token refresh
        auditService.logTokenRefresh(user.getId(), ipAddress, userAgent, requestId);

        log.info("Token refreshed for user: {}", user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(request.getRefreshToken())
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationTime() / 1000)
                .user(AuthResponse.UserInfo.fromUser(user))
                .isNewUser(false)
                .build();
    }

    @Transactional
    public void logout(String refreshToken, UUID userId, String ipAddress, String userAgent, String requestId) {
        if (refreshToken != null) {
            refreshTokenService.revokeToken(refreshToken);
        }

        // Log logout
        auditService.logLogout(userId, ipAddress, userAgent, requestId);

        log.info("User logged out: {}", userId);
    }

    @Transactional
    public void logoutAllDevices(UUID userId, String ipAddress, String userAgent, String requestId) {
        refreshTokenService.revokeAllUserTokens(userId);

        // Log logout
        auditService.logLogout(userId, ipAddress, userAgent, requestId);

        log.info("User logged out from all devices: {}", userId);
    }

    private final GoogleAuthService googleAuthService;

    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest request, String ipAddress, String userAgent, String requestId) {
        return googleAuthService.authenticate(request, ipAddress, userAgent, requestId);
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private User getUserFromPrincipal(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
