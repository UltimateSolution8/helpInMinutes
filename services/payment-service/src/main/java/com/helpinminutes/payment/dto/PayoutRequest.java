package com.helpinminutes.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class PayoutRequest {

    @NotNull(message = "Helper ID is required")
    private UUID helperId;

    @NotNull(message = "Task ID is required")
    private UUID taskId;

    @NotNull(message = "Payment ID is required")
    private UUID paymentId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    private String currency;

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "IFSC code is required")
    private String ifscCode;

    @NotBlank(message = "Account holder name is required")
    private String accountHolderName;

    private String bankName;

    private String idempotencyKey;
}