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
public class PayoutResponse {

    private UUID id;
    private UUID helperId;
    private UUID taskId;
    private UUID paymentId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String provider;
    private String providerPayoutId;
    private String utrNumber;
    private String failureReason;
    private LocalDateTime processedAt;
    private LocalDateTime settledAt;
    private Integer retryCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
