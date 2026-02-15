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
public class CreateOrderResponse {

    private UUID paymentId;
    private String orderId;
    private String razorpayOrderId;
    private UUID taskId;
    private UUID buyerId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String keyId;
    private LocalDateTime createdAt;
}
