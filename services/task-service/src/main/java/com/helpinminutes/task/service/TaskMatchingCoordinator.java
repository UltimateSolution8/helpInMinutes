package com.helpinminutes.task.service;

import com.helpinminutes.task.entity.Task;
import com.helpinminutes.task.events.TaskCreatedEvent;
import com.helpinminutes.task.events.TaskAssignedEvent;
import com.helpinminutes.task.events.TaskStatusChangedEvent;
import com.helpinminutes.task.events.TaskCancelledEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskMatchingCoordinator {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange.tasks:tasks.exchange}")
    private String tasksExchange;

    @Value("${app.rabbitmq.routing-key.task-created:task.created}")
    private String taskCreatedRoutingKey;

    @Value("${app.rabbitmq.routing-key.task-assigned:task.assigned}")
    private String taskAssignedRoutingKey;

    @Value("${app.rabbitmq.routing-key.task-status-changed:task.status.changed}")
    private String taskStatusChangedRoutingKey;

    @Value("${app.rabbitmq.routing-key.task-cancelled:task.cancelled}")
    private String taskCancelledRoutingKey;

    /**
     * Notify matching service when a new task is created
     */
    public void notifyTaskCreated(Task task) {
        TaskCreatedEvent event = TaskCreatedEvent.builder()
                .taskId(task.getId())
                .buyerId(task.getBuyerId())
                .subSkill(task.getSubSkill())
                .lat(task.getLat())
                .lng(task.getLng())
                .h3Index(task.getH3Index())
                .scheduledAt(task.getScheduledAt())
                .createdAt(task.getCreatedAt())
                .build();

        try {
            rabbitTemplate.convertAndSend(tasksExchange, taskCreatedRoutingKey, event);
            log.info("Published TaskCreatedEvent for task {}", task.getId());
        } catch (Exception e) {
            log.error("Failed to publish TaskCreatedEvent for task {}: {}", task.getId(), e.getMessage());
        }
    }

    /**
     * Notify when a task is assigned to a helper
     */
    public void notifyTaskAssigned(Task task, UUID helperId) {
        TaskAssignedEvent event = TaskAssignedEvent.builder()
                .taskId(task.getId())
                .buyerId(task.getBuyerId())
                .helperId(helperId)
                .assignedAt(task.getAcceptedAt())
                .build();

        try {
            rabbitTemplate.convertAndSend(tasksExchange, taskAssignedRoutingKey, event);
            log.info("Published TaskAssignedEvent for task {} to helper {}", task.getId(), helperId);
        } catch (Exception e) {
            log.error("Failed to publish TaskAssignedEvent for task {}: {}", task.getId(), e.getMessage());
        }
    }

    /**
     * Notify when task status changes
     */
    public void notifyTaskStatusChanged(Task task, Task.TaskStatus previousStatus) {
        TaskStatusChangedEvent event = TaskStatusChangedEvent.builder()
                .taskId(task.getId())
                .previousStatus(previousStatus)
                .newStatus(task.getStatus())
                .buyerId(task.getBuyerId())
                .helperId(task.getHelperId())
                .changedAt(LocalDateTime.now())
                .build();

        try {
            rabbitTemplate.convertAndSend(tasksExchange, taskStatusChangedRoutingKey, event);
            log.info("Published TaskStatusChangedEvent for task {}: {} -> {}", 
                    task.getId(), previousStatus, task.getStatus());
        } catch (Exception e) {
            log.error("Failed to publish TaskStatusChangedEvent for task {}: {}", task.getId(), e.getMessage());
        }
    }

    /**
     * Notify when a task is cancelled
     */
    public void notifyTaskCancelled(Task task) {
        TaskCancelledEvent event = TaskCancelledEvent.builder()
                .taskId(task.getId())
                .buyerId(task.getBuyerId())
                .helperId(task.getHelperId())
                .cancelledBy(task.getCancelledBy())
                .reason(task.getCancellationReason())
                .cancelledAt(task.getCancelledAt())
                .build();

        try {
            rabbitTemplate.convertAndSend(tasksExchange, taskCancelledRoutingKey, event);
            log.info("Published TaskCancelledEvent for task {}", task.getId());
        } catch (Exception e) {
            log.error("Failed to publish TaskCancelledEvent for task {}: {}", task.getId(), e.getMessage());
        }
    }

    /**
     * Notify when a task is completed
     */
    public void notifyTaskCompleted(Task task) {
        TaskStatusChangedEvent event = TaskStatusChangedEvent.builder()
                .taskId(task.getId())
                .previousStatus(Task.TaskStatus.IN_PROGRESS)
                .newStatus(Task.TaskStatus.COMPLETED)
                .buyerId(task.getBuyerId())
                .helperId(task.getHelperId())
                .changedAt(task.getCompletedAt())
                .build();

        try {
            rabbitTemplate.convertAndSend(tasksExchange, taskStatusChangedRoutingKey, event);
            log.info("Published TaskCompletedEvent for task {}", task.getId());
        } catch (Exception e) {
            log.error("Failed to publish TaskCompletedEvent for task {}: {}", task.getId(), e.getMessage());
        }
    }
}