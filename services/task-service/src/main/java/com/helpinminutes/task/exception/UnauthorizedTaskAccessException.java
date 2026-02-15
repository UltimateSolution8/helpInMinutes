package com.helpinminutes.task.exception;

import java.util.UUID;

public class UnauthorizedTaskAccessException extends RuntimeException {
    
    public UnauthorizedTaskAccessException(UUID taskId, UUID userId) {
        super(String.format("User %s is not authorized to access task %s", userId, taskId));
    }
    
    public UnauthorizedTaskAccessException(String message) {
        super(message);
    }
}