package com.helpinminutes.task.events;

import com.helpinminutes.task.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatusChangedEvent implements Serializable {
    
    private UUID taskId;
    private Task.TaskStatus previousStatus;
    private Task.TaskStatus newStatus;
    private UUID buyerId;
    private UUID helperId;
    private LocalDateTime changedAt;
}