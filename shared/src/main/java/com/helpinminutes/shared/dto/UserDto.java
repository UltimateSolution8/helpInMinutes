package com.helpinminutes.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {
    
    private UUID id;
    private String phoneNumber;
    private String email;
    private String firstName;
    private String lastName;
    private String profilePictureUrl;
    private UserRole role;
    private UserStatus status;
    private boolean phoneVerified;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public enum UserRole {
        CUSTOMER,
        HELPER,
        ADMIN,
        SUPER_ADMIN
    }
    
    public enum UserStatus {
        ACTIVE,
        INACTIVE,
        SUSPENDED,
        PENDING_VERIFICATION
    }
}