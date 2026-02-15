package com.helpinminutes.task.exception;

import com.helpinminutes.task.entity.Task;
import java.util.UUID;

public class InvalidTaskStateException extends RuntimeException {
    
    public InvalidTaskStateException(UUID taskId, Task.TaskStatus currentStatus, String action) {
        super(String.format("Cannot %s task %s in status %s", action, taskId, currentStatus));
    }
    
    public InvalidTaskStateException(String message) {
        super(message);
    }
}