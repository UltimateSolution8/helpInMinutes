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
public class HelperLocationUpdateEvent implements Serializable {
    
    private UUID helperId;
    private UUID taskId;
    private Double lat;
    private Double lng;
    private Double accuracy;
    private Double heading;
    private Double speed;
    private LocalDateTime timestamp;
}