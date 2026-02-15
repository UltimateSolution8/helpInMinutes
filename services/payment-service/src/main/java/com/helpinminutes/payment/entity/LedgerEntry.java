package com.helpinminutes.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries", indexes = {
    @Index(name = "idx_ledger_payment_id", columnList = "payment_id"),
    @Index(name = "idx_ledger_entry_type", columnList = "entry_type"),
    @Index(name = "idx_ledger_user_id", columnList = "user_id"),
    @Index(name = "idx_ledger_created_at", columnList = "created_at"),
    @Index(name = "idx_ledger_task_id", columnList = "task_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "user_id")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 30)
    private LedgerEntryType entryType;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "reference_id", length = 255)
    private String referenceId;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "is_reversed", nullable = false)
    @Builder.Default
    private Boolean isReversed = false;

    @Column(name = "reversed_at")
    private LocalDateTime reversedAt;

    @Column(name = "reversal_reason", length = 500)
    private String reversalReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum LedgerEntryType {
        PLATFORM_FEE,
        HELPER_PAYOUT,
        SOCIAL_SECURITY,
        TAX,
        REFUND,
        ADJUSTMENT,
        PENALTY
    }
}
