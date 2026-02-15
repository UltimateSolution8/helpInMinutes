package com.helpinminutes.identity.service;

import com.helpinminutes.identity.dto.KycDocumentUploadRequest;
import com.helpinminutes.identity.dto.KycStatusResponse;
import com.helpinminutes.identity.entity.HelperProfile;
import com.helpinminutes.identity.entity.User;
import com.helpinminutes.identity.repository.HelperProfileRepository;
import com.helpinminutes.shared.enums.KycStatus;
import com.helpinminutes.shared.events.KycStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class KycService {

    private final HelperProfileRepository helperProfileRepository;
    private final AuditService auditService;
    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.events:helpinminutes.events}")
    private String eventsExchange;

    @Value("${rabbitmq.routing-key.kyc-status-changed:kyc.status.changed}")
    private String kycStatusChangedRoutingKey;

    @Transactional(readOnly = true)
    public KycStatusResponse getKycStatus(UUID helperId) {
        HelperProfile profile = helperProfileRepository.findById(helperId)
                .orElseThrow(() -> new RuntimeException("Helper profile not found: " + helperId));
        
        return KycStatusResponse.fromHelperProfile(profile);
    }

    @Transactional
    public KycStatusResponse uploadDocument(UUID helperId, KycDocumentUploadRequest request, 
                                            String ipAddress, String userAgent, String requestId) {
        HelperProfile profile = helperProfileRepository.findById(helperId)
                .orElseThrow(() -> new RuntimeException("Helper profile not found: " + helperId));

        // Create new document
        HelperProfile.Document document = HelperProfile.Document.builder()
                .type(request.getDocumentType())
                .url(request.getDocumentUrl())
                .fileName(request.getFileName())
                .uploadedAt(LocalDateTime.now())
                .isVerified(false)
                .build();

        // Add document to profile
        if (profile.getDocuments() == null) {
            profile.setDocuments(new ArrayList<>());
        }
        profile.getDocuments().add(document);

        // Update KYC status to pending manual review if documents are uploaded
        if (profile.getKycStatus() == User.KycStatus.PENDING) {
            profile.setKycStatus(User.KycStatus.PENDING_MANUAL);
            profile.getUser().setKycStatus(User.KycStatus.PENDING_MANUAL);
        }

        HelperProfile savedProfile = helperProfileRepository.save(profile);

        // Log audit event
        auditService.logKycDocumentUpload(helperId, request.getDocumentType(), ipAddress, userAgent, requestId);

        log.info("KYC document uploaded: {} for helper: {}", request.getDocumentType(), helperId);

        return KycStatusResponse.fromHelperProfile(savedProfile);
    }

    @Transactional
    public KycStatusResponse updateKycStatus(UUID helperId, KycStatus newStatus, String reason, 
                                             UUID verifiedBy, String ipAddress, String userAgent, String requestId) {
        HelperProfile profile = helperProfileRepository.findById(helperId)
                .orElseThrow(() -> new RuntimeException("Helper profile not found: " + helperId));

        User.KycStatus oldStatus = profile.getKycStatus();
        
        // Update profile KYC status
        profile.setKycStatus(mapKycStatus(newStatus));
        
        // Update user KYC status
        User user = profile.getUser();
        user.setKycStatus(mapKycStatus(newStatus));

        HelperProfile savedProfile = helperProfileRepository.save(profile);

        // Publish KYC status changed event
        KycStatusChangedEvent event = new KycStatusChangedEvent(
                user.getId(),
                newStatus,
                mapToSharedKycStatus(oldStatus),
                reason,
                verifiedBy
        );
        
        try {
            rabbitTemplate.convertAndSend(eventsExchange, kycStatusChangedRoutingKey, event);
            log.info("Published KYC status changed event for user: {}", user.getId());
        } catch (Exception e) {
            log.error("Failed to publish KYC status changed event", e);
        }

        // Log audit event
        auditService.logKycStatusChange(helperId, oldStatus.name(), newStatus.name(), 
                                        reason, ipAddress, userAgent, requestId);

        log.info("KYC status updated from {} to {} for helper: {}", oldStatus, newStatus, helperId);

        return KycStatusResponse.fromHelperProfile(savedProfile);
    }

    @Transactional
    public KycStatusResponse verifyDocument(UUID helperId, String documentType, boolean verified, 
                                            String ipAddress, String userAgent, String requestId) {
        HelperProfile profile = helperProfileRepository.findById(helperId)
                .orElseThrow(() -> new RuntimeException("Helper profile not found: " + helperId));

        if (profile.getDocuments() != null) {
            profile.getDocuments().stream()
                    .filter(doc -> doc.getType().equals(documentType))
                    .forEach(doc -> doc.setIsVerified(verified));
        }

        HelperProfile savedProfile = helperProfileRepository.save(profile);

        log.info("Document {} verification status updated to {} for helper: {}", 
                documentType, verified, helperId);

        return KycStatusResponse.fromHelperProfile(savedProfile);
    }

    @Transactional(readOnly = true)
    public boolean isKycVerified(UUID helperId) {
        return helperProfileRepository.findById(helperId)
                .map(profile -> profile.getKycStatus() == User.KycStatus.VERIFIED)
                .orElse(false);
    }

    private User.KycStatus mapKycStatus(KycStatus status) {
        return switch (status) {
            case PENDING -> User.KycStatus.PENDING;
            case VERIFIED -> User.KycStatus.VERIFIED;
            case PENDING_MANUAL -> User.KycStatus.PENDING_MANUAL;
            case REJECTED -> User.KycStatus.REJECTED;
        };
    }

    private KycStatus mapToSharedKycStatus(User.KycStatus status) {
        return switch (status) {
            case PENDING -> KycStatus.PENDING;
            case VERIFIED -> KycStatus.VERIFIED;
            case PENDING_MANUAL -> KycStatus.PENDING_MANUAL;
            case REJECTED -> KycStatus.REJECTED;
        };
    }
}
