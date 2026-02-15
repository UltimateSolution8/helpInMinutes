package com.helpinminutes.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_task_id", columnList = "task_id"),
    @Index(name = "idx_payment_order_id", columnList = "order_id", unique = true),
    @Index(name = "idx_payment_status", columnList = "status"),
    @Index(name = "idx_payment_provider", columnList = "provider"),
    @Index(name = "idx_payment_created_at", columnList = "created_at"),
    @Index(name = "idx_payment_buyer_id", columnList = "buyer_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "buyer_id", nullable = false)
    private UUID buyerId;

    @Column(name = "helper_id")
    private UUID helperId;

    @Column(name = "order_id", nullable = false, unique = true, length = 255)
    private String orderId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    @Builder.Default
    private PaymentProvider provider = PaymentProvider.RAZORPAY;

    @Column(name = "provider_payment_id", length = 255)
    private String providerPaymentId;

    @Column(name = "provider_order_id", length = 255)
    private String providerOrderId;

    @Column(name = "provider_signature", length = 500)
    private String providerSignature;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "provider_response", columnDefinition = "jsonb")
    private String providerResponse;

    @Column(name = "platform_fee", precision = 10, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "helper_amount", precision = 10, scale = 2)
    private BigDecimal helperAmount;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "failed_at")
    private LocalDateTime failedAt;

    @Column(name = "captured_at")
    private LocalDateTime capturedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum PaymentStatus {
        PENDING, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED
    }

    public enum PaymentProvider {
        RAZORPAY, STRIPE, PAYPAL
    }
}
