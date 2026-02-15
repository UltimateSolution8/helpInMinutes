package com.helpinminutes.task.controller;

import com.helpinminutes.task.dto.*;
import com.helpinminutes.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Tag(name = "Task Management", description = "APIs for buyers to manage tasks")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @Operation(summary = "Create a new task", description = "Create a new help request with location, skill, and details")
    public ResponseEntity<TaskResponse> createTask(
            @AuthenticationPrincipal UUID buyerId,
            @Valid @RequestBody CreateTaskRequest request) {
        TaskResponse response = taskService.createTask(buyerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List buyer's tasks", description = "Get paginated list of tasks created by the buyer")
    public ResponseEntity<TaskListResponse> getMyTasks(
            @AuthenticationPrincipal UUID buyerId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        TaskListResponse response = taskService.getBuyerTasks(buyerId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Get task details", description = "Get full details of a specific task")
    public ResponseEntity<TaskResponse> getTask(
            @AuthenticationPrincipal UUID buyerId,
            @PathVariable UUID taskId) {
        TaskResponse response = taskService.getTask(taskId, buyerId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{taskId}")
    @Operation(summary = "Update task", description = "Update task details (only allowed in CREATED or MATCHING status)")
    public ResponseEntity<TaskResponse> updateTask(
            @AuthenticationPrincipal UUID buyerId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        TaskResponse response = taskService.updateTask(taskId, buyerId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{taskId}")
    @Operation(summary = "Cancel task", description = "Cancel a task with reason")
    public ResponseEntity<Void> cancelTask(
            @AuthenticationPrincipal UUID buyerId,
            @PathVariable UUID taskId,
            @Valid @RequestBody CancelTaskRequest request) {
        taskService.cancelTask(taskId, buyerId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{taskId}/dispute")
    @Operation(summary = "Raise a dispute", description = "Create a dispute for a task")
    public ResponseEntity<DisputeResponse> createDispute(
            @AuthenticationPrincipal UUID buyerId,
            @PathVariable UUID taskId,
            @Valid @RequestBody DisputeRequest request) {
        DisputeResponse response = taskService.createDispute(taskId, buyerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{taskId}/history")
    @Operation(summary = "Get task history", description = "Get audit trail/history for a task")
    public ResponseEntity<TaskHistoryResponse> getTaskHistory(
            @AuthenticationPrincipal UUID buyerId,
            @PathVariable UUID taskId) {
        TaskHistoryResponse response = taskService.getTaskHistory(taskId, buyerId);
        return ResponseEntity.ok(response);
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("asc") 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }
}