package com.helpinminutes.task.service;

import com.helpinminutes.task.dto.*;
import com.helpinminutes.task.entity.Task;
import com.helpinminutes.task.entity.TaskHistory;
import com.helpinminutes.task.exception.InvalidTaskStateException;
import com.helpinminutes.task.exception.TaskNotFoundException;
import com.helpinminutes.task.exception.UnauthorizedTaskAccessException;
import com.helpinminutes.task.repository.TaskRepository;
import com.helpinminutes.task.service.state.TaskStateMachine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskLifecycleService {

    private final TaskRepository taskRepository;
    private final TaskStateMachine stateMachine;
    private final TaskHistoryService historyService;
    private final TaskMatchingCoordinator matchingCoordinator;

    @Transactional
    public Task transitionToMatching(UUID taskId, UUID triggeredBy) {
        Task task = getTaskOrThrow(taskId);
        Task.TaskStatus previousStatus = task.getStatus();
        
        stateMachine.validateTransition(previousStatus, Task.TaskStatus.MATCHING);
        
        task.setStatus(Task.TaskStatus.MATCHING);
        Task saved = taskRepository.save(task);
        
        recordHistory(saved, previousStatus, triggeredBy, "BUYER", "Task moved to matching");
        matchingCoordinator.notifyTaskCreated(saved);
        
        log.info("Task {} transitioned to MATCHING", taskId);
        return saved;
    }

    @Transactional
    public Task transitionToDispatched(UUID taskId, UUID triggeredBy) {
        Task task = getTaskOrThrow(taskId);
        Task.TaskStatus previousStatus = task.getStatus();
        
        stateMachine.validateTransition(previousStatus, Task.TaskStatus.DISPATCHED);
        
        task.setStatus(Task.TaskStatus.DISPATCHED);
        Task saved = taskRepository.save(task);
        
        recordHistory(saved, previousStatus, triggeredBy, "SYSTEM", "Helpers found and notified");
        
        log.info("Task {} transitioned to DISPATCHED", taskId);
        return saved;
    }

    @Transactional
    public Task acceptTask(UUID taskId, UUID helperId, AcceptTaskRequest request) {
        Task task = getTaskOrThrow(taskId);
        Task.TaskStatus previousStatus = task.getStatus();
        
        stateMachine.validateTransition(previousStatus, Task.TaskStatus.ACCEPTED);
        
        task.setStatus(Task.TaskStatus.ACCEPTED);
        task.setHelperId(helperId);
        task.setAcceptedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);
        
        String notes = request.getNote() != null ? request.getNote() : "Helper accepted task";
        if (request.getEstimatedArrivalMinutes() != null) {
            notes += " (ETA: " + request.getEstimatedArrivalMinutes() + " mins)";
        }
        
        recordHistory(saved, previousStatus, helperId, "HELPER", notes);
        matchingCoordinator.notifyTaskAssigned(saved, helperId);
        
        log.info("Task {} accepted by helper {}", taskId, helperId);
        return saved;
    }

    @Transactional
    public Task startTask(UUID taskId, UUID helperId, StartTaskRequest request) {
        Task task = getTaskOrThrow(taskId);
        
        if (!helperId.equals(task.getHelperId())) {
            throw new UnauthorizedTaskAccessException(taskId, helperId);
        }
        
        Task.TaskStatus previousStatus = task.getStatus();
        stateMachine.validateTransition(previousStatus, Task.TaskStatus.IN_PROGRESS);
        
        task.setStatus(Task.TaskStatus.IN_PROGRESS);
        task.setStartedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);
        
        recordHistory(saved, previousStatus, helperId, "HELPER", 
                request.getNotes() != null ? request.getNotes() : "Task started");
        
        log.info("Task {} started by helper {}", taskId, helperId);
        return saved;
    }

    @Transactional
    public Task completeTask(UUID taskId, UUID helperId, CompleteTaskRequest request) {
        Task task = getTaskOrThrow(taskId);
        
        if (!helperId.equals(task.getHelperId())) {
            throw new UnauthorizedTaskAccessException(taskId, helperId);
        }
        
        Task.TaskStatus previousStatus = task.getStatus();
        stateMachine.validateTransition(previousStatus, Task.TaskStatus.COMPLETED);
        
        task.setStatus(Task.TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);
        
        String notes = "Task completed";
        if (request.getNotes() != null) {
            notes += ": " + request.getNotes();
        }
        if (request.getActualDurationMinutes() != null) {
            notes += " (Duration: " + request.getActualDurationMinutes() + " mins)";
        }
        
        recordHistory(saved, previousStatus, helperId, "HELPER", notes);
        matchingCoordinator.notifyTaskCompleted(saved);
        
        log.info("Task {} completed by helper {}", taskId, helperId);
        return saved;
    }

    @Transactional
    public Task cancelTask(UUID taskId, UUID cancelledBy, String cancelledByRole, CancelTaskRequest request) {
        Task task = getTaskOrThrow(taskId);
        Task.TaskStatus previousStatus = task.getStatus();
        
        if (!stateMachine.canCancel(previousStatus)) {
            throw new InvalidTaskStateException(taskId, previousStatus, "cancel");
        }
        
        task.setStatus(Task.TaskStatus.CANCELLED);
        task.setCancelledAt(LocalDateTime.now());
        task.setCancelledBy(cancelledBy);
        task.setCancellationReason(request.getReason());
        Task saved = taskRepository.save(task);
        
        String notes = "Task cancelled: " + request.getReason();
        if (request.getCategory() != null) {
            notes += " (Category: " + request.getCategory() + ")";
        }
        
        recordHistory(saved, previousStatus, cancelledBy, cancelledByRole, notes);
        matchingCoordinator.notifyTaskCancelled(saved);
        
        log.info("Task {} cancelled by {} ({})", taskId, cancelledBy, cancelledByRole);
        return saved;
    }

    @Transactional
    public Task helperArrived(UUID taskId, UUID helperId, HelperArrivedRequest request) {
        Task task = getTaskOrThrow(taskId);
        
        if (!helperId.equals(task.getHelperId())) {
            throw new UnauthorizedTaskAccessException(taskId, helperId);
        }
        
        // Arrival doesn't change status, just records the event
        String notes = "Helper arrived at location";
        if (request.getNotes() != null) {
            notes += ": " + request.getNotes();
        }
        
        recordHistory(task, task.getStatus(), helperId, "HELPER", notes);
        
        log.info("Helper {} arrived for task {}", helperId, taskId);
        return task;
    }

    @Transactional(readOnly = true)
    public boolean canTransition(UUID taskId, Task.TaskStatus toStatus) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return false;
        }
        return stateMachine.canTransition(task.getStatus(), toStatus);
    }

    private Task getTaskOrThrow(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
    }

    private void recordHistory(Task task, Task.TaskStatus previousStatus, UUID changedBy, 
                               String changedByRole, String notes) {
        historyService.recordStateChange(task, previousStatus, changedBy, changedByRole, notes);
    }
}