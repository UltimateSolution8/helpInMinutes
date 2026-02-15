package com.helpinminutes.shared.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {
    
    private UUID eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private UUID paymentId;
    private UUID taskId;
    private UUID customerId;
    private UUID helperId;
    private BigDecimal amount;
    private BigDecimal platformFee;
    private BigDecimal helperAmount;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;
    
    public PaymentCompletedEvent(UUID paymentId, UUID taskId, UUID customerId, UUID helperId,
                                BigDecimal amount, BigDecimal platformFee, BigDecimal helperAmount,
                                String razorpayPaymentId) {
        this.eventId = UUID.randomUUID();
        this.eventType = "PAYMENT_COMPLETED";
        this.timestamp = LocalDateTime.now();
        this.paymentId = paymentId;
        this.taskId = taskId;
        this.customerId = customerId;
        this.helperId = helperId;
        this.amount = amount;
        this.platformFee = platformFee;
        this.helperAmount = helperAmount;
        this.razorpayPaymentId = razorpayPaymentId;
        this.paidAt = LocalDateTime.now();
    }
}