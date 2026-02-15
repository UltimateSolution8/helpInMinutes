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
public class TaskCreatedEvent implements Serializable {
    
    private UUID taskId;
    private UUID buyerId;
    private String subSkill;
    private Double lat;
    private Double lng;
    private String h3Index;
    private LocalDateTime scheduledAt;
    private LocalDateTime createdAt;
}