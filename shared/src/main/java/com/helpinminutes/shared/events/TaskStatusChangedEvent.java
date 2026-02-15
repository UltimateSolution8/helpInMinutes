package com.helpinminutes.shared.events;

import com.helpinminutes.shared.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event published when a task status changes.
 * Used for cross-service communication and notifications.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatusChangedEvent {
    
    private UUID eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private UUID taskId;
    private UUID buyerId;
    private UUID helperId;
    private TaskStatus newStatus;
    private TaskStatus previousStatus;
    private UUID changedBy;
    private String notes;
    private LocalDateTime changedAt;
    
    public TaskStatusChangedEvent(UUID taskId, UUID buyerId, UUID helperId, 
                                  TaskStatus newStatus, TaskStatus previousStatus, 
                                  UUID changedBy, String notes) {
        this.eventId = UUID.randomUUID();
        this.eventType = "TASK_STATUS_CHANGED";
        this.timestamp = LocalDateTime.now();
        this.taskId = taskId;
        this.buyerId = buyerId;
        this.helperId = helperId;
        this.newStatus = newStatus;
        this.previousStatus = previousStatus;
        this.changedBy = changedBy;
        this.notes = notes;
        this.changedAt = LocalDateTime.now();
    }
}
