package com.helpinminutes.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentDto {
    
    private UUID id;
    private UUID taskId;
    private UUID customerId;
    private UUID helperId;
    private BigDecimal amount;
    private BigDecimal platformFee;
    private BigDecimal helperAmount;
    private PaymentStatus status;
    private PaymentMethod method;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    private String failureReason;
    private LocalDateTime paidAt;
    private LocalDateTime refundedAt;
    private BigDecimal refundAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public enum PaymentStatus {
        PENDING,
        AUTHORIZED,
        CAPTURED,
        FAILED,
        REFUNDED,
        PARTIALLY_REFUNDED
    }
    
    public enum PaymentMethod {
        UPI,
        CARD,
        NETBANKING,
        WALLET,
        COD
    }
}