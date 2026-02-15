package com.helpinminutes.task.service;

import com.helpinminutes.task.dto.*;
import com.helpinminutes.task.entity.Skill;
import com.helpinminutes.task.entity.Task;
import com.helpinminutes.task.entity.Task.TaskMetadata;
import com.helpinminutes.task.exception.InvalidTaskStateException;
import com.helpinminutes.task.exception.TaskNotFoundException;
import com.helpinminutes.task.exception.UnauthorizedTaskAccessException;
import com.helpinminutes.task.repository.SkillRepository;
import com.helpinminutes.task.repository.TaskRepository;
import com.helpinminutes.task.service.state.TaskStateMachine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final SkillRepository skillRepository;
    private final TaskLifecycleService lifecycleService;
    private final TaskHistoryService historyService;
    private final DisputeService disputeService;
    private final TaskStateMachine stateMachine;

    private static final BigDecimal PLATFORM_FEE_PERCENTAGE = new BigDecimal("0.15");

    @Transactional
    public TaskResponse createTask(UUID buyerId, CreateTaskRequest request) {
        // Get skill for pricing
        Skill skill = skillRepository.findBySlug(request.getSubSkill())
                .orElseThrow(() -> new RuntimeException("Skill not found: " + request.getSubSkill()));

        // Calculate H3 index (simplified - in real implementation use H3 library)
        String h3Index = calculateH3Index(request.getLat(), request.getLng());

        // Calculate pricing
        BigDecimal price = calculatePrice(skill);
        BigDecimal platformFee = price.multiply(PLATFORM_FEE_PERCENTAGE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal helperAmount = price.subtract(platformFee);

        // Build metadata
        TaskMetadata metadata = null;
        if (request.getMetadata() != null) {
            metadata = TaskMetadata.builder()
                    .urgency(request.getMetadata().getUrgency())
                    .estimatedDuration(request.getMetadata().getEstimatedDuration())
                    .specialRequirements(request.getMetadata().getSpecialRequirements())
                    .requiresTools(request.getMetadata().getRequiresTools())
                    .requiresMaterials(request.getMetadata().getRequiresMaterials())
                    .build();
        }

        // Build attachments list
        List<String> attachments = new java.util.ArrayList<>();
        if (request.getPhotos() != null) {
            attachments.addAll(request.getPhotos());
        }

        Task task = Task.builder()
                .buyerId(buyerId)
                .title(request.getTitle())
                .description(request.getDescription())
                .lat(request.getLat())
                .lng(request.getLng())
                .h3Index(h3Index)
                .address(request.getAddress())
                .city(request.getCity())
                .subSkill(request.getSubSkill())
                .status(Task.TaskStatus.CREATED)
                .price(price)
                .platformFee(platformFee)
                .helperAmount(helperAmount)
                .scheduledAt(request.getScheduledAt())
                .attachments(attachments)
                .metadata(metadata)
                .build();

        Task saved = taskRepository.save(task);
        
        // Record initial history
        historyService.recordStateChange(saved, null, buyerId, "BUYER", "Task created");
        
        // Transition to matching
        saved = lifecycleService.transitionToMatching(saved.getId(), buyerId);
        
        log.info("Created task {} for buyer {}", saved.getId(), buyerId);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(UUID taskId, UUID userId) {
        Task task = taskRepository.findByIdWithHistory(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        
        // Verify access
        if (!hasAccess(task, userId)) {
            throw new UnauthorizedTaskAccessException(taskId, userId);
        }
        
        return mapToResponse(task);
    }

    @Transactional(readOnly = true)
    public TaskListResponse getBuyerTasks(UUID buyerId, Pageable pageable) {
        Page<Task> tasks = taskRepository.findByBuyerId(buyerId, pageable);
        return mapToListResponse(tasks);
    }

    @Transactional(readOnly = true)
    public TaskListResponse getHelperTasks(UUID helperId, Pageable pageable) {
        Page<Task> tasks = taskRepository.findByHelperId(helperId, pageable);
        return mapToListResponse(tasks);
    }

    @Transactional
    public TaskResponse updateTask(UUID taskId, UUID buyerId, UpdateTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        
        // Verify ownership
        if (!task.getBuyerId().equals(buyerId)) {
            throw new UnauthorizedTaskAccessException(taskId, buyerId);
        }
        
        // Check if task can be modified
        if (!stateMachine.canModify(task.getStatus())) {
            throw new InvalidTaskStateException(taskId, task.getStatus(), "update");
        }
        
        // Update fields
        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getAddress() != null) {
            task.setAddress(request.getAddress());
        }
        if (request.getScheduledAt() != null) {
            task.setScheduledAt(request.getScheduledAt());
        }
        if (request.getPhotos() != null) {
            task.setAttachments(request.getPhotos());
        }
        if (request.getMetadata() != null) {
            TaskMetadata metadata = TaskMetadata.builder()
                    .urgency(request.getMetadata().getUrgency())
                    .estimatedDuration(request.getMetadata().getEstimatedDuration())
                    .specialRequirements(request.getMetadata().getSpecialRequirements())
                    .requiresTools(request.getMetadata().getRequiresTools())
                    .requiresMaterials(request.getMetadata().getRequiresMaterials())
                    .build();
            task.setMetadata(metadata);
        }
        
        Task saved = taskRepository.save(task);
        historyService.recordStateChange(saved, saved.getStatus(), buyerId, "BUYER", "Task updated");
        
        log.info("Updated task {} by buyer {}", taskId, buyerId);
        return mapToResponse(saved);
    }

    @Transactional
    public void cancelTask(UUID taskId, UUID buyerId, CancelTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        
        // Verify ownership
        if (!task.getBuyerId().equals(buyerId)) {
            throw new UnauthorizedTaskAccessException(taskId, buyerId);
        }
        
        lifecycleService.cancelTask(taskId, buyerId, "BUYER", request);
        log.info("Cancelled task {} by buyer {}", taskId, buyerId);
    }

    @Transactional
    public TaskResponse acceptTask(UUID taskId, UUID helperId, AcceptTaskRequest request) {
        Task task = lifecycleService.acceptTask(taskId, helperId, request);
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse startTask(UUID taskId, UUID helperId, StartTaskRequest request) {
        Task task = lifecycleService.startTask(taskId, helperId, request);
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse completeTask(UUID taskId, UUID helperId, CompleteTaskRequest request) {
        Task task = lifecycleService.completeTask(taskId, helperId, request);
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse helperArrived(UUID taskId, UUID helperId, HelperArrivedRequest request) {
        Task task = lifecycleService.helperArrived(taskId, helperId, request);
        return mapToResponse(task);
    }

    @Transactional
    public DisputeResponse createDispute(UUID taskId, UUID userId, DisputeRequest request) {
        return disputeService.createDispute(taskId, userId, request);
    }

    @Transactional(readOnly = true)
    public TaskHistoryResponse getTaskHistory(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        
        if (!hasAccess(task, userId)) {
            throw new UnauthorizedTaskAccessException(taskId, userId);
        }
        
        List<com.helpinminutes.task.entity.TaskHistory> histories = historyService.getTaskHistory(taskId);
        
        List<TaskHistoryResponse.HistoryEntryDto> entries = histories.stream()
                .map(h -> TaskHistoryResponse.HistoryEntryDto.builder()
                        .id(h.getId())
                        .status(h.getStatus())
                        .previousStatus(h.getPreviousStatus())
                        .changedBy(h.getChangedBy())
                        .changedByRole(h.getChangedByRole())
                        .notes(h.getNotes())
                        .createdAt(h.getCreatedAt())
                        .build())
                .toList();
        
        return TaskHistoryResponse.builder()
                .entries(entries)
                .build();
    }

    private boolean hasAccess(Task task, UUID userId) {
        return task.getBuyerId().equals(userId) || 
               (task.getHelperId() != null && task.getHelperId().equals(userId));
    }

    private String calculateH3Index(Double lat, Double lng) {
        // Simplified H3 calculation - in real implementation use H3 library
        // For now, return a shorter string representation of approximate cell
        int resolution = 9;
        long latPart = Math.round((lat + 90) * 1000);
        long lngPart = Math.round((lng + 180) * 1000);
        return String.format("%d_%d_%d", resolution, latPart, lngPart);
    }

    private BigDecimal calculatePrice(Skill skill) {
        if (skill.getBasePrice() != null) {
            return skill.getBasePrice();
        }
        // Default price if not set
        return new BigDecimal("500.00");
    }

    private TaskResponse mapToResponse(Task task) {
        TaskResponse.TaskMetadataDto metadataDto = null;
        if (task.getMetadata() != null) {
            metadataDto = TaskResponse.TaskMetadataDto.builder()
                    .urgency(task.getMetadata().getUrgency())
                    .estimatedDuration(task.getMetadata().getEstimatedDuration())
                    .specialRequirements(task.getMetadata().getSpecialRequirements())
                    .requiresTools(task.getMetadata().getRequiresTools())
                    .requiresMaterials(task.getMetadata().getRequiresMaterials())
                    .build();
        }

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .lat(task.getLat())
                .lng(task.getLng())
                .h3Index(task.getH3Index())
                .address(task.getAddress())
                .city(task.getCity())
                .subSkill(task.getSubSkill())
                .status(task.getStatus())
                .price(task.getPrice())
                .platformFee(task.getPlatformFee())
                .helperAmount(task.getHelperAmount())
                .scheduledAt(task.getScheduledAt())
                .acceptedAt(task.getAcceptedAt())
                .startedAt(task.getStartedAt())
                .completedAt(task.getCompletedAt())
                .cancelledAt(task.getCancelledAt())
                .cancellationReason(task.getCancellationReason())
                .cancelledBy(task.getCancelledBy())
                .photos(task.getAttachments())
                .metadata(metadataDto)
                .hasDispute(disputeService.hasDispute(task.getId()))
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    private TaskListResponse mapToListResponse(Page<Task> tasks) {
        List<TaskListResponse.TaskSummaryDto> summaries = tasks.getContent().stream()
                .map(task -> TaskListResponse.TaskSummaryDto.builder()
                        .id(task.getId())
                        .title(task.getTitle())
                        .description(task.getDescription() != null && task.getDescription().length() > 100 
                                ? task.getDescription().substring(0, 100) + "..." 
                                : task.getDescription())
                        .subSkillName(task.getSubSkill())
                        .status(task.getStatus())
                        .price(task.getPrice())
                        .hasPhotos(task.getAttachments() != null && !task.getAttachments().isEmpty())
                        .scheduledAt(task.getScheduledAt())
                        .createdAt(task.getCreatedAt())
                        .updatedAt(task.getUpdatedAt())
                        .build())
                .toList();

        TaskListResponse.PaginationInfoDto pagination = TaskListResponse.PaginationInfoDto.builder()
                .page(tasks.getNumber())
                .size(tasks.getSize())
                .totalElements(tasks.getTotalElements())
                .totalPages(tasks.getTotalPages())
                .first(tasks.isFirst())
                .last(tasks.isLast())
                .hasNext(tasks.hasNext())
                .hasPrevious(tasks.hasPrevious())
                .build();

        return TaskListResponse.builder()
                .tasks(summaries)
                .pagination(pagination)
                .build();
    }
}