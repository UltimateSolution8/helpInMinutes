package com.helpinminutes.payment.dto;

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
public class PaymentResponse {

    private UUID id;
    private UUID taskId;
    private UUID buyerId;
    private UUID helperId;
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String provider;
    private String providerPaymentId;
    private String providerOrderId;
    private BigDecimal platformFee;
    private BigDecimal helperAmount;
    private BigDecimal taxAmount;
    private String failureReason;
    private LocalDateTime failedAt;
    private LocalDateTime capturedAt;
    private LocalDateTime refundedAt;
    private BigDecimal refundAmount;
    private String refundReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
