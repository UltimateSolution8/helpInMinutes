package com.helpinminutes.task.exception;

import java.util.UUID;

public class DisputeAlreadyExistsException extends RuntimeException {
    
    public DisputeAlreadyExistsException(UUID taskId) {
        super(String.format("A dispute already exists for task: %s", taskId));
    }
    
    public DisputeAlreadyExistsException(String message) {
        super(message);
    }
}