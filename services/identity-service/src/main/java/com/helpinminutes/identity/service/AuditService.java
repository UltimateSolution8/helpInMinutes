package com.helpinminutes.identity.service;

import com.helpinminutes.identity.entity.AuditLog;
import com.helpinminutes.identity.entity.User;
import com.helpinminutes.identity.repository.AuditLogRepository;
import com.helpinminutes.identity.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(String action, String entityType, UUID entityId, 
                         String oldValues, String newValues, String description,
                         String ipAddress, String userAgent, String requestId) {
        
        User user = getCurrentUser();
        
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValues(oldValues)
                .newValues(newValues)
                .description(description)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .requestId(requestId)
                .build();
        
        auditLogRepository.save(auditLog);
        log.debug("Audit log created: {} - {}", action, entityType);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuthEvent(String action, String description, String ipAddress, 
                             String userAgent, String requestId) {
        logEvent(action, "AUTH", null, null, null, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logUserEvent(String action, UUID userId, String description, 
                             String ipAddress, String userAgent, String requestId) {
        logEvent(action, "USER", userId, null, null, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logKycEvent(String action, UUID helperId, String oldStatus, 
                            String newStatus, String description, String ipAddress, 
                            String userAgent, String requestId) {
        logEvent(action, "KYC", helperId, oldStatus, newStatus, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLoginSuccess(String email, UUID userId, String ipAddress, 
                                String userAgent, String deviceId, String requestId) {
        String description = String.format("User login successful: %s from IP: %s, Device: %s", 
                email, ipAddress, deviceId);
        logUserEvent("LOGIN_SUCCESS", userId, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLoginFailure(String email, String reason, String ipAddress, 
                                String userAgent, String requestId) {
        String description = String.format("User login failed: %s, Reason: %s, IP: %s", 
                email, reason, ipAddress);
        logAuthEvent("LOGIN_FAILURE", description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSignup(String email, UUID userId, String role, String ipAddress, 
                          String userAgent, String requestId) {
        String description = String.format("New user signup: %s, Role: %s, IP: %s", 
                email, role, ipAddress);
        logUserEvent("SIGNUP", userId, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogout(UUID userId, String ipAddress, String userAgent, String requestId) {
        String description = String.format("User logout: %s from IP: %s", userId, ipAddress);
        logUserEvent("LOGOUT", userId, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logTokenRefresh(UUID userId, String ipAddress, String userAgent, String requestId) {
        String description = String.format("Token refreshed for user: %s from IP: %s", userId, ipAddress);
        logUserEvent("TOKEN_REFRESH", userId, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logPasswordChange(UUID userId, String ipAddress, String userAgent, String requestId) {
        String description = String.format("Password changed for user: %s from IP: %s", userId, ipAddress);
        logUserEvent("PASSWORD_CHANGE", userId, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logProfileUpdate(UUID userId, String changedFields, String ipAddress, 
                                 String userAgent, String requestId) {
        String description = String.format("Profile updated for user: %s, Fields: %s, IP: %s", 
                userId, changedFields, ipAddress);
        logUserEvent("PROFILE_UPDATE", userId, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logKycDocumentUpload(UUID helperId, String documentType, String ipAddress, 
                                     String userAgent, String requestId) {
        String description = String.format("KYC document uploaded: %s for helper: %s", 
                documentType, helperId);
        logKycEvent("KYC_DOC_UPLOAD", helperId, null, null, description, ipAddress, userAgent, requestId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logKycStatusChange(UUID helperId, String oldStatus, String newStatus, 
                                   String reason, String ipAddress, String userAgent, String requestId) {
        String description = String.format("KYC status changed from %s to %s for helper: %s, Reason: %s", 
                oldStatus, newStatus, helperId, reason);
        logKycEvent("KYC_STATUS_CHANGE", helperId, oldStatus, newStatus, description, ipAddress, userAgent, requestId);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = new User();
            user.setId(principal.getId());
            return user;
        }
        return null;
    }
}
