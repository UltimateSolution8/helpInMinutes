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
public class RefundResponse {

    private UUID id;
    private UUID paymentId;
    private String providerRefundId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String reason;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
