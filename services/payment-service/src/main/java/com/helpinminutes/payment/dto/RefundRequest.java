package com.helpinminutes.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundRequest {

    @NotNull(message = "Payment ID is required")
    private UUID paymentId;

    @DecimalMin(value = "0.01", message = "Refund amount must be greater than 0")
    private BigDecimal amount;

    private String reason;

    private boolean fullRefund;

    private String idempotencyKey;
}
