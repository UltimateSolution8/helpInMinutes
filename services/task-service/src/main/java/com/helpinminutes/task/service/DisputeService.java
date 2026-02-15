package com.helpinminutes.task.service;

import com.helpinminutes.task.dto.DisputeRequest;
import com.helpinminutes.task.dto.DisputeResponse;
import com.helpinminutes.task.entity.Dispute;
import com.helpinminutes.task.entity.Task;
import com.helpinminutes.task.exception.DisputeAlreadyExistsException;
import com.helpinminutes.task.exception.TaskNotFoundException;
import com.helpinminutes.task.repository.DisputeRepository;
import com.helpinminutes.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public DisputeResponse createDispute(UUID taskId, UUID createdBy, DisputeRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));

        // Check if dispute already exists
        disputeRepository.findByTaskId(taskId).ifPresent(d -> {
            throw new DisputeAlreadyExistsException(taskId);
        });

        Dispute dispute = Dispute.builder()
                .task(task)
                .createdBy(createdBy)
                .status(Dispute.DisputeStatus.OPEN)
                .reason(request.getReason())
                .description(request.getDescription())
                .evidence(request.getEvidence() != null ? request.getEvidence() : List.of())
                .requestedResolution(request.getRequestedResolution())
                .build();

        Dispute saved = disputeRepository.save(dispute);
        log.info("Created dispute {} for task {}", saved.getId(), taskId);
        
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public DisputeResponse getDispute(UUID disputeId) {
        Dispute dispute = disputeRepository.findByIdWithTask(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found: " + disputeId));
        return mapToResponse(dispute);
    }

    @Transactional(readOnly = true)
    public DisputeResponse getDisputeByTaskId(UUID taskId) {
        Dispute dispute = disputeRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("No dispute found for task: " + taskId));
        return mapToResponse(dispute);
    }

    @Transactional(readOnly = true)
    public Page<DisputeResponse> getDisputesByStatus(Dispute.DisputeStatus status, Pageable pageable) {
        return disputeRepository.findByStatus(status, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public DisputeResponse resolveDispute(UUID disputeId, UUID resolvedBy, Dispute.Resolution resolution, 
                                          String resolutionNotes, Double refundAmount) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found: " + disputeId));

        dispute.setStatus(Dispute.DisputeStatus.RESOLVED);
        dispute.setResolution(resolution);
        dispute.setResolutionNotes(resolutionNotes);
        dispute.setRefundAmount(refundAmount);
        dispute.setResolvedBy(resolvedBy);
        dispute.setResolvedAt(LocalDateTime.now());

        Dispute saved = disputeRepository.save(dispute);
        log.info("Resolved dispute {} with resolution {}", disputeId, resolution);
        
        return mapToResponse(saved);
    }

    @Transactional
    public DisputeResponse updateDisputeStatus(UUID disputeId, Dispute.DisputeStatus newStatus) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found: " + disputeId));

        dispute.setStatus(newStatus);
        Dispute saved = disputeRepository.save(dispute);
        
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public boolean hasDispute(UUID taskId) {
        return disputeRepository.findByTaskId(taskId).isPresent();
    }

    private DisputeResponse mapToResponse(Dispute dispute) {
        return DisputeResponse.builder()
                .id(dispute.getId())
                .taskId(dispute.getTask().getId())
                .createdBy(dispute.getCreatedBy())
                .status(dispute.getStatus())
                .reason(dispute.getReason())
                .description(dispute.getDescription())
                .evidence(dispute.getEvidence())
                .requestedResolution(dispute.getRequestedResolution())
                .resolutionNotes(dispute.getResolutionNotes())
                .resolution(dispute.getResolution())
                .resolvedBy(dispute.getResolvedBy())
                .resolvedAt(dispute.getResolvedAt())
                .refundAmount(dispute.getRefundAmount())
                .createdAt(dispute.getCreatedAt())
                .updatedAt(dispute.getUpdatedAt())
                .build();
    }
}