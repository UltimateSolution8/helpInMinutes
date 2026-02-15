package com.helpinminutes.task.controller;

import com.helpinminutes.task.dto.*;
import com.helpinminutes.task.entity.Dispute;
import com.helpinminutes.task.entity.Task;
import com.helpinminutes.task.service.DisputeService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/tasks")
@RequiredArgsConstructor
@Tag(name = "Admin Task Management", description = "Admin APIs for task management and intervention")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTaskController {

    private final TaskService taskService;
    private final DisputeService disputeService;

    @GetMapping("/{taskId}")
    @Operation(summary = "Get task details (Admin)", description = "Get full task details including internal info")
    public ResponseEntity<TaskResponse> getTask(@PathVariable UUID taskId) {
        // Admin can access any task
        TaskResponse response = taskService.getTask(taskId, null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{taskId}/reassign")
    @Operation(summary = "Reassign task", description = "Admin reassigns task to a different helper")
    public ResponseEntity<TaskResponse> reassignTask(
            @AuthenticationPrincipal UUID adminId,
            @PathVariable UUID taskId,
            @Valid @RequestBody AdminReassignRequest request) {
        // Implementation would go here
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/intervene")
    @Operation(summary = "Admin intervene", description = "Admin intervenes in a task (hold payment, force cancel, etc.)")
    public ResponseEntity<Void> intervene(
            @AuthenticationPrincipal UUID adminId,
            @PathVariable UUID taskId,
            @Valid @RequestBody AdminInterveneRequest request) {
        // Implementation would go here
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{taskId}/history")
    @Operation(summary = "Get task history (Admin)", description = "Get complete audit trail for a task")
    public ResponseEntity<TaskHistoryResponse> getTaskHistory(@PathVariable UUID taskId) {
        TaskHistoryResponse response = taskService.getTaskHistory(taskId, null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{taskId}/dispute")
    @Operation(summary = "Get task dispute", description = "Get dispute details for a task")
    public ResponseEntity<DisputeResponse> getTaskDispute(@PathVariable UUID taskId) {
        DisputeResponse response = disputeService.getDisputeByTaskId(taskId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/disputes/{disputeId}/resolve")
    @Operation(summary = "Resolve dispute", description = "Resolve a dispute with decision")
    public ResponseEntity<DisputeResponse> resolveDispute(
            @AuthenticationPrincipal UUID adminId,
            @PathVariable UUID disputeId,
            @RequestParam Dispute.Resolution resolution,
            @RequestParam String resolutionNotes,
            @RequestParam(required = false) Double refundAmount) {
        DisputeResponse response = disputeService.resolveDispute(disputeId, adminId, resolution, resolutionNotes, refundAmount);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/disputes")
    @Operation(summary = "List disputes", description = "Get paginated list of disputes by status")
    public ResponseEntity<?> listDisputes(
            @RequestParam(required = false) Dispute.DisputeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (status != null) {
            return ResponseEntity.ok(disputeService.getDisputesByStatus(status, pageable));
        }
        // Return all disputes if no status filter
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @Operation(summary = "List all tasks", description = "Get paginated list of all tasks with filters")
    public ResponseEntity<?> listTasks(
            @RequestParam(required = false) Task.TaskStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Implementation would go here
        return ResponseEntity.ok().build();
    }
}