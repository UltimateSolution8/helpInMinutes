package com.helpinminutes.identity.service;

import com.helpinminutes.identity.dto.UpdateProfileRequest;
import com.helpinminutes.identity.dto.UserProfileResponse;
import com.helpinminutes.identity.entity.User;
import com.helpinminutes.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(UUID userId) {
        User user = userRepository.findByIdWithHelperProfile(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        return UserProfileResponse.fromUser(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        return UserProfileResponse.fromUser(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request,
                                             String ipAddress, String userAgent, String requestId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        StringBuilder changedFields = new StringBuilder();

        if (request.getName() != null && !request.getName().equals(user.getName())) {
            user.setName(request.getName());
            changedFields.append("name ");
        }

        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            // Check if phone is already taken
            if (!request.getPhone().equals(user.getPhone()) && userRepository.existsByPhone(request.getPhone())) {
                throw new RuntimeException("Phone number already in use");
            }
            user.setPhone(request.getPhone());
            user.setIsPhoneVerified(false);
            changedFields.append("phone ");
        }

        if (request.getProfilePictureUrl() != null && !request.getProfilePictureUrl().equals(user.getProfilePictureUrl())) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
            changedFields.append("profilePictureUrl ");
        }

        User savedUser = userRepository.save(user);

        // Log audit event
        if (changedFields.length() > 0) {
            auditService.logProfileUpdate(userId, changedFields.toString().trim(), ipAddress, userAgent, requestId);
        }

        log.info("Profile updated for user: {}, changed fields: {}", userId, changedFields);

        return UserProfileResponse.fromUser(savedUser);
    }

    @Transactional
    public void deactivateAccount(UUID userId, String ipAddress, String userAgent, String requestId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setIsActive(false);
        userRepository.save(user);

        // Log audit event
        auditService.logUserEvent("ACCOUNT_DEACTIVATED", userId, 
                "User account deactivated", ipAddress, userAgent, requestId);

        log.info("Account deactivated for user: {}", userId);
    }

    @Transactional
    public void activateAccount(UUID userId, String ipAddress, String userAgent, String requestId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setIsActive(true);
        userRepository.save(user);

        // Log audit event
        auditService.logUserEvent("ACCOUNT_ACTIVATED", userId, 
                "User account activated", ipAddress, userAgent, requestId);

        log.info("Account activated for user: {}", userId);
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public boolean existsByPhone(String phone) {
        return userRepository.existsByPhone(phone);
    }
}
