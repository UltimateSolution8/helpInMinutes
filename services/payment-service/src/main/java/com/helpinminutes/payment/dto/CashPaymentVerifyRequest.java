package com.helpinminutes.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashPaymentVerifyRequest {

    @NotNull(message = "Payment ID is required")
    private UUID paymentId;

    @NotBlank(message = "OTP is required")
    private String otp;
}
