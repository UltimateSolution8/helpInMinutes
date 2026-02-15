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
public class CashPaymentRequest {

    @NotNull(message = "Task ID is required")
    private UUID taskId;

    @NotNull(message = "Buyer ID is required")
    private UUID buyerId;

    @NotNull(message = "Helper ID is required")
    private UUID helperId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    private String currency;

    private String notes;
}
