package com.helpinminutes.shared.events;

import com.helpinminutes.shared.enums.KycStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event published when a user's KYC status changes.
 * Used for notifications and helper onboarding workflow.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycStatusChangedEvent {
    
    private UUID eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private UUID userId;
    private KycStatus newStatus;
    private KycStatus previousStatus;
    private String reason;
    private UUID verifiedBy;
    private LocalDateTime verifiedAt;
    
    public KycStatusChangedEvent(UUID userId, KycStatus newStatus, KycStatus previousStatus, 
                                 String reason, UUID verifiedBy) {
        this.eventId = UUID.randomUUID();
        this.eventType = "KYC_STATUS_CHANGED";
        this.timestamp = LocalDateTime.now();
        this.userId = userId;
        this.newStatus = newStatus;
        this.previousStatus = previousStatus;
        this.reason = reason;
        this.verifiedBy = verifiedBy;
        this.verifiedAt = LocalDateTime.now();
    }
}
