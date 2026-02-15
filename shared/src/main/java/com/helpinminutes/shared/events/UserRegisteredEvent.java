package com.helpinminutes.shared.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event published when a new user registers in the system.
 * Used for cross-service communication via RabbitMQ.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisteredEvent {
    
    private UUID eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private UUID userId;
    private String email;
    private String name;
    private String role;
    private String phone;
    
    public UserRegisteredEvent(UUID userId, String email, String name, String role, String phone) {
        this.eventId = UUID.randomUUID();
        this.eventType = "USER_REGISTERED";
        this.timestamp = LocalDateTime.now();
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
        this.phone = phone;
    }
}
