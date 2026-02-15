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
@Table(name = "payouts", indexes = {
    @Index(name = "idx_payout_helper_id", columnList = "helper_id"),
    @Index(name = "idx_payout_status", columnList = "status"),
    @Index(name = "idx_payout_provider", columnList = "provider"),
    @Index(name = "idx_payout_created_at", columnList = "created_at"),
    @Index(name = "idx_payout_processed_at", columnList = "processed_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "helper_id", nullable = false)
    private UUID helperId;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "payment_id", nullable = false)
    private UUID paymentId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PayoutStatus status = PayoutStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    @Builder.Default
    private PayoutProvider provider = PayoutProvider.RAZORPAYX;

    @Column(name = "provider_payout_id", length = 255)
    private String providerPayoutId;

    @Column(name = "provider_response", length = 2000)
    private String providerResponse;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bank_account", columnDefinition = "jsonb")
    private BankAccountDetails bankAccount;

    @Column(name = "utr_number", length = 50)
    private String utrNumber;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum PayoutStatus {
        PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    }

    public enum PayoutProvider {
        RAZORPAYX, CASHFREE, MANUAL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BankAccountDetails {
        private String accountNumber;
        private String ifscCode;
        private String accountHolderName;
        private String bankName;
    }
}
