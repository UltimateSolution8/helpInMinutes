package com.helpinminutes.shared.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Event published when a helper's online status or location changes.
 * Used by matching-service to track available helpers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HelperStatusChangedEvent {
    
    private UUID eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private UUID helperId;
    private Boolean isOnline;
    private String currentH3;
    private Double currentLat;
    private Double currentLng;
    private List<String> skills;
    private LocalDateTime lastSeenAt;
    
    public HelperStatusChangedEvent(UUID helperId, Boolean isOnline, String currentH3, 
                                    Double currentLat, Double currentLng, List<String> skills) {
        this.eventId = UUID.randomUUID();
        this.eventType = "HELPER_STATUS_CHANGED";
        this.timestamp = LocalDateTime.now();
        this.helperId = helperId;
        this.isOnline = isOnline;
        this.currentH3 = currentH3;
        this.currentLat = currentLat;
        this.currentLng = currentLng;
        this.skills = skills;
        this.lastSeenAt = LocalDateTime.now();
    }
}
