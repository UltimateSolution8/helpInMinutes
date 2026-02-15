package com.helpinminutes.matching.messaging;

import com.helpinminutes.matching.dto.MatchRequest;
import com.helpinminutes.matching.dto.MatchResult;
import com.helpinminutes.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

/**
 * RabbitMQ listener for handling match requests and related events.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatchRequestHandler {

    private final MatchingService matchingService;

    /**
     * Listen for task created events and trigger matching.
     */
    @RabbitListener(queues = "matching.task.created.queue")
    public void handleTaskCreatedEvent(@Payload Map<String, Object> event) {
        log.info("Received TaskCreatedEvent: {}", event);
        
        try {
            // Convert event to MatchRequest
            MatchRequest request = convertToMatchRequest(event);
            
            // Trigger matching
            MatchResult result = matchingService.matchTask(request);
            
            log.info("Matching completed for task {}: status={}", 
                    request.getTaskId(), result.getStatus());
            
        } catch (Exception e) {
            log.error("Error processing TaskCreatedEvent: {}", event, e);
            // Message will be retried or moved to DLQ based on configuration
            throw e;
        }
    }

    /**
     * Listen for helper status changes.
     */
    @RabbitListener(queues = "matching.helper.status.queue")
    public void handleHelperStatusChanged(@Payload Map<String, Object> event) {
        log.debug("Received HelperStatusChangedEvent: {}", event);
        
        try {
            String helperId = (String) event.get("helperId");
            String status = (String) event.get("status");
            
            if (helperId == null || status == null) {
                log.warn("Invalid HelperStatusChangedEvent: missing helperId or status");
                return;
            }
            
            // Update helper status in location index
            // This is handled by the location update service
            log.debug("Helper {} status changed to {}", helperId, status);
            
        } catch (Exception e) {
            log.error("Error processing HelperStatusChangedEvent: {}", event, e);
        }
    }

    /**
     * Listen for helper location updates.
     */
    @RabbitListener(queues = "matching.helper.location.queue")
    public void handleHelperLocationUpdate(@Payload Map<String, Object> event) {
        log.debug("Received HelperLocationUpdateEvent: {}", event);
        
        try {
            String helperId = (String) event.get("helperId");
            Double lat = getDoubleValue(event.get("latitude"));
            Double lng = getDoubleValue(event.get("longitude"));
            String status = (String) event.get("status");
            
            if (helperId == null || lat == null || lng == null) {
                log.warn("Invalid HelperLocationUpdateEvent: missing required fields");
                return;
            }
            
            // Location is updated via the location controller/service
            // This listener is for any additional processing needed
            log.debug("Helper {} location updated to {}, {}", helperId, lat, lng);
            
        } catch (Exception e) {
            log.error("Error processing HelperLocationUpdateEvent: {}", event, e);
        }
    }

    /**
     * Convert event map to MatchRequest.
     */
    private MatchRequest convertToMatchRequest(Map<String, Object> event) {
        MatchRequest request = new MatchRequest();
        
        request.setTaskId((String) event.get("taskId"));
        request.setCustomerId((String) event.get("customerId"));
        request.setServiceType((String) event.get("serviceType"));
        request.setServiceSubtype((String) event.get("serviceSubtype"));
        
        // Location
        request.setTaskLatitude(getDoubleValue(event.get("latitude")));
        request.setTaskLongitude(getDoubleValue(event.get("longitude")));
        request.setAddress((String) event.get("address"));
        request.setCity((String) event.get("city"));
        request.setPincode((String) event.get("pincode"));
        
        // Details
        request.setDescription((String) event.get("description"));
        
        @SuppressWarnings("unchecked")
        java.util.List<String> skills = (java.util.List<String>) event.get("requiredSkills");
        request.setRequiredSkills(skills);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> attributes = (Map<String, Object>) event.get("taskAttributes");
        request.setTaskAttributes(attributes);
        
        // Scheduling
        String scheduledTime = (String) event.get("scheduledTime");
        if (scheduledTime != null) {
            request.setScheduledTime(Instant.parse(scheduledTime));
        }
        
        request.setEstimatedDurationMinutes(getIntegerValue(event.get("estimatedDurationMinutes")));
        
        // Preferences
        request.setMaxHelpersToNotify(getIntegerValue(event.get("maxHelpersToNotify")));
        request.setMaxSearchRadiusKm(getDoubleValue(event.get("maxSearchRadiusKm")));
        request.setMaxWaitTimeSeconds(getIntegerValue(event.get("maxWaitTimeSeconds")));
        
        // Pricing
        request.setEstimatedPrice(getDoubleValue(event.get("estimatedPrice")));
        request.setPriceCurrency((String) event.get("priceCurrency"));
        
        // Priority
        request.setPriority(getIntegerValue(event.get("priority")));
        
        // Metadata
        request.setRequestTime(Instant.now());
        request.setRequestSource("RABBITMQ_EVENT");
        
        return request;
    }

    private Double getDoubleValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer getIntegerValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
