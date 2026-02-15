package com.helpinminutes.identity.service;

import com.helpinminutes.identity.dto.HelperRegistrationRequest;
import com.helpinminutes.identity.dto.UserProfileResponse;
import com.helpinminutes.identity.entity.HelperProfile;
import com.helpinminutes.identity.entity.RefreshToken;
import com.helpinminutes.identity.entity.User;
import com.helpinminutes.identity.repository.HelperProfileRepository;
import com.helpinminutes.identity.repository.UserRepository;
import com.helpinminutes.identity.security.JwtTokenProvider;
import com.helpinminutes.shared.events.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HelperService {

    private final UserRepository userRepository;
    private final HelperProfileRepository helperProfileRepository;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;
    private final RabbitTemplate rabbitTemplate;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Value("${rabbitmq.exchange.events:helpinminutes.events}")
    private String eventsExchange;

    @Value("${rabbitmq.routing-key.user-registered:user.registered}")
    private String userRegisteredRoutingKey;

    @Transactional
    public UserProfileResponse registerHelper(HelperRegistrationRequest request, 
                                              String ipAddress, String userAgent, String requestId) {
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
                .role(User.UserRole.HELPER)
                .kycStatus(User.KycStatus.PENDING)
                .isActive(true)
                .isEmailVerified(false)
                .isPhoneVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // Create helper profile
        HelperProfile.BankAccount bankAccount = null;
        if (request.getBankAccountNumber() != null && request.getBankIfscCode() != null) {
            bankAccount = HelperProfile.BankAccount.builder()
                    .accountNumber(request.getBankAccountNumber())
                    .ifscCode(request.getBankIfscCode())
                    .accountHolderName(request.getAccountHolderName() != null ? 
                            request.getAccountHolderName() : request.getName())
                    .bankName(request.getBankName())
                    .isVerified(false)
                    .build();
        }

        HelperProfile helperProfile = HelperProfile.builder()
                .user(savedUser)
                .skills(request.getSkills() != null ? request.getSkills() : new ArrayList<>())
                .kycStatus(User.KycStatus.PENDING)
                .isOnline(false)
                .bio(request.getBio())
                .hourlyRate(request.getHourlyRate())
                .bankAccount(bankAccount)
                .documents(new ArrayList<>())
                .rating(java.math.BigDecimal.ZERO)
                .totalReviews(0)
                .totalTasksCompleted(0)
                .build();

        HelperProfile savedProfile = helperProfileRepository.save(helperProfile);
        savedUser.setHelperProfile(savedProfile);

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
            log.info("Published user registered event for helper: {}", savedUser.getId());
        } catch (Exception e) {
            log.error("Failed to publish user registered event", e);
        }

        // Log audit event
        auditService.logSignup(request.getEmail(), savedUser.getId(), "HELPER", ipAddress, userAgent, requestId);

        log.info("Helper registered successfully: {}", savedUser.getId());

        return UserProfileResponse.fromUser(savedUser);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getHelperProfile(UUID helperId) {
        HelperProfile profile = helperProfileRepository.findById(helperId)
                .orElseThrow(() -> new RuntimeException("Helper profile not found: " + helperId));
        
        return UserProfileResponse.fromUser(profile.getUser());
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getHelperProfileByUserId(UUID userId) {
        HelperProfile profile = helperProfileRepository.findByUserIdWithUser(userId)
                .orElseThrow(() -> new RuntimeException("Helper profile not found for user: " + userId));
        
        return UserProfileResponse.fromUser(profile.getUser());
    }

    @Transactional
    public UserProfileResponse updateHelperProfile(UUID userId, HelperRegistrationRequest request,
                                                   String ipAddress, String userAgent, String requestId) {
        HelperProfile profile = helperProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Helper profile not found for user: " + userId));

        // Update skills
        if (request.getSkills() != null) {
            profile.setSkills(request.getSkills());
        }

        // Update bio
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }

        // Update hourly rate
        if (request.getHourlyRate() != null) {
            profile.setHourlyRate(request.getHourlyRate());
        }

        // Update bank account
        if (request.getBankAccountNumber() != null && request.getBankIfscCode() != null) {
            HelperProfile.BankAccount bankAccount = HelperProfile.BankAccount.builder()
                    .accountNumber(request.getBankAccountNumber())
                    .ifscCode(request.getBankIfscCode())
                    .accountHolderName(request.getAccountHolderName() != null ? 
                            request.getAccountHolderName() : profile.getUser().getName())
                    .bankName(request.getBankName())
                    .isVerified(false)
                    .build();
            profile.setBankAccount(bankAccount);
        }

        HelperProfile savedProfile = helperProfileRepository.save(profile);

        // Log audit event
        auditService.logUserEvent("HELPER_PROFILE_UPDATED", userId, 
                "Helper profile updated", ipAddress, userAgent, requestId);

        log.info("Helper profile updated for user: {}", userId);

        return UserProfileResponse.fromUser(savedProfile.getUser());
    }

    @Transactional
    public void updateOnlineStatus(UUID helperId, boolean isOnline, String h3Index, 
                                   Double lat, Double lng, String ipAddress, String userAgent, String requestId) {
        HelperProfile profile = helperProfileRepository.findById(helperId)
                .orElseThrow(() -> new RuntimeException("Helper profile not found: " + helperId));

        profile.setIsOnline(isOnline);
        if (isOnline) {
            profile.setCurrentH3(h3Index);
            profile.setCurrentLat(lat);
            profile.setCurrentLng(lng);
            profile.setLastSeenAt(java.time.LocalDateTime.now());
        }

        helperProfileRepository.save(profile);

        // Log audit event only on status change
        if (profile.getIsOnline() != isOnline) {
            auditService.logUserEvent(isOnline ? "HELPER_ONLINE" : "HELPER_OFFLINE", 
                    profile.getUser().getId(), 
                    "Helper status changed to " + (isOnline ? "online" : "offline"), 
                    ipAddress, userAgent, requestId);
        }

        log.info("Helper {} online status updated to {}", helperId, isOnline);
    }
}
