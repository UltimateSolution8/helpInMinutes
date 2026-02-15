package com.helpinminutes.payment.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpinminutes.payment.dto.CreateOrderRequest;
import com.helpinminutes.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    /**
     * Listen for TaskAssignedEvent - Create payment order when task is assigned
     */
    @RabbitListener(queues = "${rabbitmq.queue.task.assigned:task.assigned}")
    public void handleTaskAssignedEvent(String message) {
        log.info("Received TaskAssignedEvent: {}", message);

        try {
            Map<String, Object> event = objectMapper.readValue(message, Map.class);
            
            UUID taskId = UUID.fromString((String) event.get("taskId"));
            UUID buyerId = UUID.fromString((String) event.get("buyerId"));
            UUID helperId = event.get("helperId") != null ? 
                    UUID.fromString((String) event.get("helperId")) : null;
            BigDecimal amount = new BigDecimal(event.get("amount").toString());
            String currency = (String) event.getOrDefault("currency", "INR");

            // Create payment order
            CreateOrderRequest request = CreateOrderRequest.builder()
                    .taskId(taskId)
                    .buyerId(buyerId)
                    .helperId(helperId)
                    .amount(amount)
                    .currency(currency)
                    .receipt("task_" + taskId)
                    .notes("Payment order for task " + taskId)
                    .build();

            paymentService.createOrder(request);
            log.info("Payment order created for task: {}", taskId);

        } catch (Exception e) {
            log.error("Error processing TaskAssignedEvent: {}", e.getMessage(), e);
            // In production, you might want to send to a dead letter queue
        }
    }

    /**
     * Listen for TaskCompletedEvent - Trigger payment capture
     */
    @RabbitListener(queues = "${rabbitmq.queue.task.completed:task.completed}")
    public void handleTaskCompletedEvent(String message) {
        log.info("Received TaskCompletedEvent: {}", message);

        try {
            Map<String, Object> event = objectMapper.readValue(message, Map.class);
            
            UUID taskId = UUID.fromString((String) event.get("taskId"));
            UUID paymentId = event.get("paymentId") != null ? 
                    UUID.fromString((String) event.get("paymentId")) : null;

            if (paymentId != null) {
                // In a real implementation, you might want to auto-capture or notify
                log.info("Task completed. Payment {} should be captured for task {}", paymentId, taskId);
                
                // For now, we just log - actual capture happens via frontend callback
                // or you could implement auto-capture here if the payment is authorized
            }

        } catch (Exception e) {
            log.error("Error processing TaskCompletedEvent: {}", e.getMessage(), e);
        }
    }
}
