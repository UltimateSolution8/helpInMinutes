package com.helpinminutes.task.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "disputes", indexes = {
    @Index(name = "idx_dispute_task_id", columnList = "task_id", unique = true),
    @Index(name = "idx_dispute_status", columnList = "status"),
    @Index(name = "idx_dispute_created_by", columnList = "created_by"),
    @Index(name = "idx_dispute_created_at", columnList = "created_at"),
    @Index(name = "idx_dispute_resolved_at", columnList = "resolved_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false, unique = true)
    private Task task;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DisputeStatus status = DisputeStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, length = 50)
    private DisputeReason reason;

    @Column(name = "description", nullable = false, length = 2000)
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "evidence", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> evidence = new ArrayList<>();

    @Column(name = "requested_resolution", length = 1000)
    private String requestedResolution;

    @Column(name = "resolution_notes", length = 2000)
    private String resolutionNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution", length = 20)
    private Resolution resolution;

    @Column(name = "resolved_by")
    private UUID resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "refund_amount")
    private Double refundAmount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum DisputeStatus {
        OPEN, UNDER_REVIEW, RESOLVED, CLOSED
    }

    public enum DisputeReason {
        HELPER_NO_SHOW,
        TASK_INCOMPLETE,
        POOR_QUALITY,
        OVERCHARGING,
        HELPER_MISCONDUCT,
        BUYER_MISCONDUCT,
        PAYMENT_ISSUE,
        OTHER
    }

    public enum Resolution {
        BUYER_FAVORED,
        HELPER_FAVORED,
        SPLIT,
        NO_ACTION
    }
}
