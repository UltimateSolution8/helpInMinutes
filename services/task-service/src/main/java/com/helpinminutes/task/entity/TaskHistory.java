package com.helpinminutes.task.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "task_history", indexes = {
    @Index(name = "idx_task_history_task_id", columnList = "task_id"),
    @Index(name = "idx_task_history_status", columnList = "status"),
    @Index(name = "idx_task_history_created_at", columnList = "created_at"),
    @Index(name = "idx_task_history_changed_by", columnList = "changed_by")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Task.TaskStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 20)
    private Task.TaskStatus previousStatus;

    @Column(name = "changed_by")
    private UUID changedBy;

    @Column(name = "changed_by_role", length = 20)
    private String changedByRole;

    @Column(name = "notes", length = 1000)
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private HistoryMetadata metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryMetadata {
        private String ipAddress;
        private String userAgent;
        private String reason;
        private String location;
    }
}
