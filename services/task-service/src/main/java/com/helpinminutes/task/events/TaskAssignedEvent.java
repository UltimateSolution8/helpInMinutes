package com.helpinminutes.task.events;

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
public class TaskAssignedEvent implements Serializable {
    
    private UUID taskId;
    private UUID buyerId;
    private UUID helperId;
    private LocalDateTime assignedAt;
}