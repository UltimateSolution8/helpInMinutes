package com.helpinminutes.task.service.state;

import com.helpinminutes.task.entity.Task;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Task State Machine - Manages valid state transitions for tasks.
 * 
 * State Flow:
 * CREATED -> MATCHING (on create)
 * MATCHING -> DISPATCHED (when helpers found)
 * DISPATCHED -> ACCEPTED (when helper accepts)
 * ACCEPTED -> IN_PROGRESS (when helper starts)
 * IN_PROGRESS -> COMPLETED (when task done)
 * Any -> CANCELLED (with validation)
 */
@Slf4j
@Component
public class TaskStateMachine {

    private final Map<Task.TaskStatus, Set<Task.TaskStatus>> validTransitions;

    public TaskStateMachine() {
        this.validTransitions = new EnumMap<>(Task.TaskStatus.class);
        initializeTransitions();
    }

    private void initializeTransitions() {
        // CREATED can transition to MATCHING or CANCELLED
        validTransitions.put(Task.TaskStatus.CREATED, EnumSet.of(
            Task.TaskStatus.MATCHING,
            Task.TaskStatus.CANCELLED
        ));

        // MATCHING can transition to DISPATCHED, CREATED (retry), or CANCELLED
        validTransitions.put(Task.TaskStatus.MATCHING, EnumSet.of(
            Task.TaskStatus.DISPATCHED,
            Task.TaskStatus.CREATED,  // Retry matching
            Task.TaskStatus.CANCELLED
        ));

        // DISPATCHED can transition to ACCEPTED or CANCELLED
        validTransitions.put(Task.TaskStatus.DISPATCHED, EnumSet.of(
            Task.TaskStatus.ACCEPTED,
            Task.TaskStatus.MATCHING,  // Return to matching if no one accepts
            Task.TaskStatus.CANCELLED
        ));

        // ACCEPTED can transition to IN_PROGRESS or CANCELLED
        validTransitions.put(Task.TaskStatus.ACCEPTED, EnumSet.of(
            Task.TaskStatus.IN_PROGRESS,
            Task.TaskStatus.CANCELLED
        ));

        // IN_PROGRESS can transition to COMPLETED or CANCELLED
        validTransitions.put(Task.TaskStatus.IN_PROGRESS, EnumSet.of(
            Task.TaskStatus.COMPLETED,
            Task.TaskStatus.CANCELLED
        ));

        // COMPLETED is a terminal state
        validTransitions.put(Task.TaskStatus.COMPLETED, EnumSet.noneOf(Task.TaskStatus.class));

        // CANCELLED is a terminal state
        validTransitions.put(Task.TaskStatus.CANCELLED, EnumSet.noneOf(Task.TaskStatus.class));
    }

    /**
     * Check if a state transition is valid
     */
    public boolean canTransition(Task.TaskStatus fromStatus, Task.TaskStatus toStatus) {
        if (fromStatus == null || toStatus == null) {
            return false;
        }
        
        Set<Task.TaskStatus> allowedTransitions = validTransitions.get(fromStatus);
        return allowedTransitions != null && allowedTransitions.contains(toStatus);
    }

    /**
     * Validate and throw exception if transition is invalid
     */
    public void validateTransition(Task.TaskStatus fromStatus, Task.TaskStatus toStatus) {
        if (!canTransition(fromStatus, toStatus)) {
            throw new InvalidStateTransitionException(
                String.format("Invalid state transition from %s to %s", fromStatus, toStatus)
            );
        }
    }

    /**
     * Get all valid next states from a given state
     */
    public Set<Task.TaskStatus> getValidNextStates(Task.TaskStatus currentStatus) {
        return validTransitions.getOrDefault(currentStatus, EnumSet.noneOf(Task.TaskStatus.class));
    }

    /**
     * Check if the task is in a terminal state
     */
    public boolean isTerminalState(Task.TaskStatus status) {
        return status == Task.TaskStatus.COMPLETED || status == Task.TaskStatus.CANCELLED;
    }

    /**
     * Check if the task can be cancelled from current state
     */
    public boolean canCancel(Task.TaskStatus currentStatus) {
        return canTransition(currentStatus, Task.TaskStatus.CANCELLED);
    }

    /**
     * Check if the task can be modified (update details)
     */
    public boolean canModify(Task.TaskStatus currentStatus) {
        return currentStatus == Task.TaskStatus.CREATED || currentStatus == Task.TaskStatus.MATCHING;
    }

    /**
     * Check if helper can accept from current state
     */
    public boolean canAccept(Task.TaskStatus currentStatus) {
        return canTransition(currentStatus, Task.TaskStatus.ACCEPTED);
    }

    /**
     * Check if helper can start from current state
     */
    public boolean canStart(Task.TaskStatus currentStatus) {
        return canTransition(currentStatus, Task.TaskStatus.IN_PROGRESS);
    }

    /**
     * Check if task can be completed from current state
     */
    public boolean canComplete(Task.TaskStatus currentStatus) {
        return canTransition(currentStatus, Task.TaskStatus.COMPLETED);
    }

    /**
     * Get the initial state for a new task
     */
    public Task.TaskStatus getInitialState() {
        return Task.TaskStatus.CREATED;
    }

    /**
     * Exception thrown when an invalid state transition is attempted
     */
    public static class InvalidStateTransitionException extends RuntimeException {
        public InvalidStateTransitionException(String message) {
            super(message);
        }
    }
}