package com.helpinminutes.matching.service;

import com.helpinminutes.matching.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/**
 * Service for dispatching tasks to helpers and managing responses.
 * Handles the notification flow and claim coordination.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchDispatcher {

    private final RabbitTemplate rabbitTemplate;
    private final AtomicClaimService claimService;

    @Value("${app.rabbitmq.exchange.tasks:tasks.exchange}")
    private String tasksExchange;

    @Value("${app.rabbitmq.exchange.events:events.exchange}")
    private String eventsExchange;

    // Executor for async dispatch operations
    private final ExecutorService dispatchExecutor = Executors.newCachedThreadPool();
    
    // Track pending dispatches
    private final ConcurrentHashMap<String, DispatchState> pendingDispatches = new ConcurrentHashMap<>();

    /**
     * Dispatch a task to a list of helpers.
     * 
     * @param request Dispatch request
     * @return Dispatch result with notified helpers
     */
    public DispatchResult dispatchTask(DispatchRequest request) {
        String taskId = request.getTaskId();
        List<String> helperIds = request.getHelperIds();
        int batchSize = request.getBatchSize();
        int timeoutSeconds = request.getTimeoutSeconds();
        
        log.info("Dispatching task {} to {} helpers (batch size: {}, timeout: {}s)",
                taskId, helperIds.size(), batchSize, timeoutSeconds);
        
        // Record dispatch in Redis
        claimService.recordDispatch(taskId, helperIds);
        
        // Create dispatch state
        DispatchState state = new DispatchState(taskId, helperIds, batchSize, timeoutSeconds);
        pendingDispatches.put(taskId, state);
        
        // Send notifications in batches
        List<String> notifiedHelpers = new ArrayList<>();
        int batches = (int) Math.ceil((double) helperIds.size() / batchSize);
        
        for (int i = 0; i < batches; i++) {
            int start = i * batchSize;
            int end = Math.min(start + batchSize, helperIds.size());
            List<String> batch = helperIds.subList(start, end);
            
            // Check if task already claimed
            if (!claimService.isTaskAvailable(taskId)) {
                log.info("Task {} already claimed, stopping dispatch", taskId);
                break;
            }
            
            // Send notifications for this batch
            for (String helperId : batch) {
                if (sendNotification(taskId, helperId, request)) {
                    notifiedHelpers.add(helperId);
                    state.markNotified(helperId);
                }
            }
            
            // Wait before next batch (unless first batch)
            if (i < batches - 1) {
                try {
                    Thread.sleep(2000); // 2 second delay between batches
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        state.setNotifiedCount(notifiedHelpers.size());
        
        return DispatchResult.builder()
                .taskId(taskId)
                .notifiedHelpers(notifiedHelpers)
                .notifiedCount(notifiedHelpers.size())
                .dispatchTime(Instant.now())
                .timeoutSeconds(timeoutSeconds)
                .build();
    }
    
    /**
     * Dispatch task asynchronously and wait for first accept or timeout.
     * 
     * @param request Dispatch request
     * @return Future with the helper who claimed, or null on timeout
     */
    public CompletableFuture<String> dispatchAndWait(DispatchRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            String taskId = request.getTaskId();
            int timeoutSeconds = request.getTimeoutSeconds();
            
            // Start dispatch
            dispatchTask(request);
            
            // Wait for claim or timeout
            long deadline = System.currentTimeMillis() + (timeoutSeconds * 1000L);
            
            while (System.currentTimeMillis() < deadline) {
                String claimedBy = claimService.getClaimedHelper(taskId);
                if (claimedBy != null) {
                    log.info("Task {} claimed by helper {} during dispatch", taskId, claimedBy);
                    pendingDispatches.remove(taskId);
                    return claimedBy;
                }
                
                try {
                    Thread.sleep(100); // Check every 100ms
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            
            // Timeout
            log.info("Task {} dispatch timed out after {} seconds", taskId, timeoutSeconds);
            pendingDispatches.remove(taskId);
            return null;
            
        }, dispatchExecutor);
    }
    
    /**
     * Send notification to a single helper.
     * 
     * @param taskId Task ID
     * @param helperId Helper ID
     * @param request Dispatch request with task details
     * @return true if notification sent successfully
     */
    private boolean sendNotification(String taskId, String helperId, DispatchRequest request) {
        try {
            // Build notification payload
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "TASK_OFFER");
            notification.put("taskId", taskId);
            notification.put("helperId", helperId);
            notification.put("serviceType", request.getServiceType());
            notification.put("serviceSubtype", request.getServiceSubtype());
            notification.put("estimatedPrice", request.getEstimatedPrice());
            notification.put("latitude", request.getTaskLatitude());
            notification.put("longitude", request.getTaskLongitude());
            notification.put("address", request.getAddress());
            notification.put("description", request.getDescription());
            notification.put("timeoutSeconds", request.getTimeoutSeconds());
            notification.put("timestamp", Instant.now().toString());
            
            // Send to helper notification queue
            String routingKey = String.format("helper.%s.notification", helperId);
            rabbitTemplate.convertAndSend(eventsExchange, routingKey, notification);
            
            log.debug("Sent task offer notification to helper {} for task {}", helperId, taskId);
            return true;
            
        } catch (Exception e) {
            log.error("Failed to send notification to helper {} for task {}", helperId, taskId, e);
            return false;
        }
    }
    
    /**
     * Handle a helper declining a task.
     * 
     * @param request Decline request
     */
    public void handleDecline(HelperDeclineRequest request) {
        String taskId = request.getTaskId();
        String helperId = request.getHelperId();
        
        // Record decline
        claimService.recordDecline(taskId, helperId);
        
        // Update dispatch state
        DispatchState state = pendingDispatches.get(taskId);
        if (state != null) {
            state.markDeclined(helperId);
        }
        
        log.info("Helper {} declined task {} (reason: {})", 
                helperId, taskId, request.getDeclineReason());
        
        // Publish decline event
        publishDeclineEvent(request);
    }
    
    /**
     * Check if all dispatched helpers have declined.
     * 
     * @param taskId Task ID
     * @return true if all helpers declined
     */
    public boolean allHelpersDeclined(String taskId) {
        DispatchState state = pendingDispatches.get(taskId);
        if (state == null) {
            // Check Redis for declined set
            Set<String> dispatched = claimService.getDispatchedHelpers(taskId);
            Set<String> declined = claimService.getDeclinedHelpers(taskId);
            return !dispatched.isEmpty() && dispatched.size() == declined.size();
        }
        return state.allDeclined();
    }
    
    /**
     * Get dispatch state for a task.
     * 
     * @param taskId Task ID
     * @return Dispatch state or null
     */
    public DispatchState getDispatchState(String taskId) {
        return pendingDispatches.get(taskId);
    }
    
    /**
     * Cancel a pending dispatch.
     * 
     * @param taskId Task ID
     */
    public void cancelDispatch(String taskId) {
        pendingDispatches.remove(taskId);
        log.info("Cancelled dispatch for task {}", taskId);
    }
    
    /**
     * Publish decline event to RabbitMQ.
     */
    private void publishDeclineEvent(HelperDeclineRequest request) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "TASK_DECLINED");
            event.put("taskId", request.getTaskId());
            event.put("helperId", request.getHelperId());
            event.put("reason", request.getReason());
            event.put("declineReason", request.getDeclineReason());
            event.put("timestamp", request.getDeclinedAt().toString());
            
            rabbitTemplate.convertAndSend(eventsExchange, "task.declined", event);
        } catch (Exception e) {
            log.error("Failed to publish decline event", e);
        }
    }
    
    /**
     * Inner class to track dispatch state.
     */
    public static class DispatchState {
        private final String taskId;
        private final List<String> targetHelpers;
        private final Set<String> notifiedHelpers = ConcurrentHashMap.newKeySet();
        private final Set<String> declinedHelpers = ConcurrentHashMap.newKeySet();
        private final int batchSize;
        private final int timeoutSeconds;
        private volatile int notifiedCount = 0;
        private final Instant dispatchTime;
        
        public DispatchState(String taskId, List<String> targetHelpers, int batchSize, int timeoutSeconds) {
            this.taskId = taskId;
            this.targetHelpers = new ArrayList<>(targetHelpers);
            this.batchSize = batchSize;
            this.timeoutSeconds = timeoutSeconds;
            this.dispatchTime = Instant.now();
        }
        
        public void markNotified(String helperId) {
            notifiedHelpers.add(helperId);
        }
        
        public void markDeclined(String helperId) {
            declinedHelpers.add(helperId);
        }
        
        public boolean allDeclined() {
            return !notifiedHelpers.isEmpty() && 
                   declinedHelpers.size() >= notifiedHelpers.size();
        }
        
        public boolean isTimedOut() {
            return Instant.now().isAfter(dispatchTime.plusSeconds(timeoutSeconds));
        }
        
        public void setNotifiedCount(int count) {
            this.notifiedCount = count;
        }
        
        public String getTaskId() { return taskId; }
        public List<String> getTargetHelpers() { return targetHelpers; }
        public Set<String> getNotifiedHelpers() { return notifiedHelpers; }
        public Set<String> getDeclinedHelpers() { return declinedHelpers; }
        public int getNotifiedCount() { return notifiedCount; }
        public int getTimeoutSeconds() { return timeoutSeconds; }
    }
    
    /**
     * Dispatch result DTO.
     */
    @lombok.Builder
    @lombok.Data
    public static class DispatchResult {
        private String taskId;
        private List<String> notifiedHelpers;
        private int notifiedCount;
        private Instant dispatchTime;
        private int timeoutSeconds;
    }
}
