package com.helpinminutes.shared.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignedEvent {
    
    private UUID eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private UUID taskId;
    private UUID customerId;
    private UUID helperId;
    private LocalDateTime assignedAt;
    
    public TaskAssignedEvent(UUID taskId, UUID customerId, UUID helperId) {
        this.eventId = UUID.randomUUID();
        this.eventType = "TASK_ASSIGNED";
        this.timestamp = LocalDateTime.now();
        this.taskId = taskId;
        this.customerId = customerId;
        this.helperId = helperId;
        this.assignedAt = LocalDateTime.now();
    }
}