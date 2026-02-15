package com.helpinminutes.task.exception;

import java.util.UUID;

public class TaskNotFoundException extends RuntimeException {
    
    public TaskNotFoundException(UUID taskId) {
        super(String.format("Task not found with id: %s", taskId));
    }
    
    public TaskNotFoundException(String message) {
        super(message);
    }
}