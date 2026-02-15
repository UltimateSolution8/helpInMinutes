package com.helpinminutes.shared.events;

import com.helpinminutes.shared.dto.TaskDto;
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
public class TaskCreatedEvent {
    
    private UUID eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private UUID taskId;
    private UUID customerId;
    private TaskDto.LocationDto location;
    private String h3Index;
    private TaskDto.TaskCategory category;
    
    public TaskCreatedEvent(UUID taskId, UUID customerId, TaskDto.LocationDto location, 
                           String h3Index, TaskDto.TaskCategory category) {
        this.eventId = UUID.randomUUID();
        this.eventType = "TASK_CREATED";
        this.timestamp = LocalDateTime.now();
        this.taskId = taskId;
        this.customerId = customerId;
        this.location = location;
        this.h3Index = h3Index;
        this.category = category;
    }
}