package com.helpinminutes.task.service;

import com.helpinminutes.task.entity.Task;
import com.helpinminutes.task.entity.TaskHistory;
import com.helpinminutes.task.repository.TaskHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskHistoryService {

    private final TaskHistoryRepository taskHistoryRepository;

    @Transactional
    public TaskHistory recordStateChange(Task task, Task.TaskStatus previousStatus, UUID changedBy, 
                                         String changedByRole, String notes) {
        TaskHistory history = TaskHistory.builder()
                .task(task)
                .status(task.getStatus())
                .previousStatus(previousStatus)
                .changedBy(changedBy)
                .changedByRole(changedByRole)
                .notes(notes)
                .build();
        
        TaskHistory saved = taskHistoryRepository.save(history);
        log.debug("Recorded state change for task {}: {} -> {}", 
                task.getId(), previousStatus, task.getStatus());
        return saved;
    }

    @Transactional
    public TaskHistory recordStateChange(Task task, Task.TaskStatus previousStatus, UUID changedBy, 
                                         String changedByRole, String notes, 
                                         TaskHistory.HistoryMetadata metadata) {
        TaskHistory history = TaskHistory.builder()
                .task(task)
                .status(task.getStatus())
                .previousStatus(previousStatus)
                .changedBy(changedBy)
                .changedByRole(changedByRole)
                .notes(notes)
                .metadata(metadata)
                .build();
        
        TaskHistory saved = taskHistoryRepository.save(history);
        log.debug("Recorded state change for task {}: {} -> {}", 
                task.getId(), previousStatus, task.getStatus());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<TaskHistory> getTaskHistory(UUID taskId) {
        return taskHistoryRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
    }

    @Transactional(readOnly = true)
    public Page<TaskHistory> getTaskHistory(UUID taskId, Pageable pageable) {
        return taskHistoryRepository.findByTaskId(taskId, pageable);
    }

    @Transactional(readOnly = true)
    public List<TaskHistory> getTaskHistoryByStatus(UUID taskId, Task.TaskStatus status) {
        return taskHistoryRepository.findByTaskIdAndStatus(taskId, status);
    }

    @Transactional(readOnly = true)
    public Long getHistoryCount(UUID taskId) {
        return taskHistoryRepository.countByTaskId(taskId);
    }
}