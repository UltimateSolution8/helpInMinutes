package com.helpinminutes.task.controller;

import com.helpinminutes.task.dto.*;
import com.helpinminutes.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/helpers/tasks")
@RequiredArgsConstructor
@Tag(name = "Helper Task Management", description = "APIs for helpers to manage their tasks")
@SecurityRequirement(name = "bearerAuth")
public class HelperTaskController {

    private final TaskService taskService;

    @GetMapping
    @Operation(summary = "List helper's tasks", description = "Get paginated list of tasks assigned to the helper")
    public ResponseEntity<TaskListResponse> getMyTasks(
            @AuthenticationPrincipal UUID helperId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        TaskListResponse response = taskService.getHelperTasks(helperId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Get task details", description = "Get full details of an assigned task")
    public ResponseEntity<TaskResponse> getTask(
            @AuthenticationPrincipal UUID helperId,
            @PathVariable UUID taskId) {
        TaskResponse response = taskService.getTask(taskId, helperId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{taskId}/accept")
    @Operation(summary = "Accept task", description = "Helper accepts a dispatched task (atomic operation)")
    public ResponseEntity<TaskResponse> acceptTask(
            @AuthenticationPrincipal UUID helperId,
            @PathVariable UUID taskId,
            @Valid @RequestBody AcceptTaskRequest request) {
        TaskResponse response = taskService.acceptTask(taskId, helperId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{taskId}/arrived")
    @Operation(summary = "Mark arrived", description = "Helper marks arrival at task location")
    public ResponseEntity<TaskResponse> markArrived(
            @AuthenticationPrincipal UUID helperId,
            @PathVariable UUID taskId,
            @Valid @RequestBody HelperArrivedRequest request) {
        TaskResponse response = taskService.helperArrived(taskId, helperId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{taskId}/start")
    @Operation(summary = "Start task", description = "Helper marks task as started/in progress")
    public ResponseEntity<TaskResponse> startTask(
            @AuthenticationPrincipal UUID helperId,
            @PathVariable UUID taskId,
            @Valid @RequestBody StartTaskRequest request) {
        TaskResponse response = taskService.startTask(taskId, helperId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{taskId}/complete")
    @Operation(summary = "Complete task", description = "Helper marks task as completed with completion code")
    public ResponseEntity<TaskResponse> completeTask(
            @AuthenticationPrincipal UUID helperId,
            @PathVariable UUID taskId,
            @Valid @RequestBody CompleteTaskRequest request) {
        TaskResponse response = taskService.completeTask(taskId, helperId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{taskId}/history")
    @Operation(summary = "Get task history", description = "Get audit trail for an assigned task")
    public ResponseEntity<TaskHistoryResponse> getTaskHistory(
            @AuthenticationPrincipal UUID helperId,
            @PathVariable UUID taskId) {
        TaskHistoryResponse response = taskService.getTaskHistory(taskId, helperId);
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