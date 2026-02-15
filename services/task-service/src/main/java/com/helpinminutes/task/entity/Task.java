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
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tasks", indexes = {
    @Index(name = "idx_task_buyer_id", columnList = "buyer_id"),
    @Index(name = "idx_task_helper_id", columnList = "helper_id"),
    @Index(name = "idx_task_status", columnList = "status"),
    @Index(name = "idx_task_h3_index", columnList = "h3_index"),
    @Index(name = "idx_task_sub_skill", columnList = "sub_skill"),
    @Index(name = "idx_task_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "buyer_id", nullable = false)
    private UUID buyerId;

    @Column(name = "helper_id")
    private UUID helperId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "lat", nullable = false)
    private Double lat;

    @Column(name = "lng", nullable = false)
    private Double lng;

    @Column(name = "h3_index", nullable = false, length = 15)
    private String h3Index;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "sub_skill", nullable = false, length = 100)
    private String subSkill;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.CREATED;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "platform_fee", precision = 10, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "helper_amount", precision = 10, scale = 2)
    private BigDecimal helperAmount;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachments", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private TaskMetadata metadata;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TaskHistory> history = new ArrayList<>();

    @OneToOne(mappedBy = "task", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Dispute dispute;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum TaskStatus {
        CREATED, MATCHING, DISPATCHED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskMetadata {
        private String urgency;
        private Integer estimatedDuration;
        private String specialRequirements;
        private Boolean requiresTools;
        private Boolean requiresMaterials;
    }
}
