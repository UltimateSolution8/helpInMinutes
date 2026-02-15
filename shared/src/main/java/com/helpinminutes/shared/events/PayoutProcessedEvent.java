package com.helpinminutes.shared.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event published when a helper payout is processed.
 * Used for notifications and financial tracking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayoutProcessedEvent {
    
    private UUID eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private UUID payoutId;
    private UUID paymentId;
    private UUID taskId;
    private UUID helperId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String utrNumber;
    private String providerPayoutId;
    private LocalDateTime processedAt;
    
    public PayoutProcessedEvent(UUID payoutId, UUID paymentId, UUID taskId, UUID helperId,
                                BigDecimal amount, String currency, String status,
                                String utrNumber, String providerPayoutId) {
        this.eventId = UUID.randomUUID();
        this.eventType = "PAYOUT_PROCESSED";
        this.timestamp = LocalDateTime.now();
        this.payoutId = payoutId;
        this.paymentId = paymentId;
        this.taskId = taskId;
        this.helperId = helperId;
        this.amount = amount;
        this.currency = currency;
        this.status = status;
        this.utrNumber = utrNumber;
        this.providerPayoutId = providerPayoutId;
        this.processedAt = LocalDateTime.now();
    }
}
