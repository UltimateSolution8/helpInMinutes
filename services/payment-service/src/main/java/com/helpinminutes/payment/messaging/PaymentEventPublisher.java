package com.helpinminutes.payment.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.helpinminutes.payment.entity.Payment;
import com.helpinminutes.payment.entity.Payout;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${rabbitmq.exchange.payment:payment.exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.routing-key.payment.completed:payment.completed}")
    private String paymentCompletedRoutingKey;

    @Value("${rabbitmq.routing-key.payout.processed:payout.processed}")
    private String payoutProcessedRoutingKey;

    /**
     * Publish PaymentCompletedEvent
     */
    public void publishPaymentCompleted(Payment payment) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "PaymentCompleted");
            event.put("paymentId", payment.getId().toString());
            event.put("taskId", payment.getTaskId().toString());
            event.put("buyerId", payment.getBuyerId().toString());
            event.put("helperId", payment.getHelperId() != null ? payment.getHelperId().toString() : null);
            event.put("amount", payment.getAmount());
            event.put("currency", payment.getCurrency());
            event.put("platformFee", payment.getPlatformFee());
            event.put("helperAmount", payment.getHelperAmount());
            event.put("providerPaymentId", payment.getProviderPaymentId());
            event.put("timestamp", LocalDateTime.now().toString());

            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(paymentExchange, paymentCompletedRoutingKey, message);
            
            log.info("Published PaymentCompletedEvent for payment: {}", payment.getId());
        } catch (Exception e) {
            log.error("Failed to publish PaymentCompletedEvent: {}", e.getMessage(), e);
        }
    }

    /**
     * Publish PayoutProcessedEvent
     */
    public void publishPayoutProcessed(Payout payout) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "PayoutProcessed");
            event.put("payoutId", payout.getId().toString());
            event.put("paymentId", payout.getPaymentId().toString());
            event.put("taskId", payout.getTaskId().toString());
            event.put("helperId", payout.getHelperId().toString());
            event.put("amount", payout.getAmount());
            event.put("currency", payout.getCurrency());
            event.put("utrNumber", payout.getUtrNumber());
            event.put("status", payout.getStatus().name());
            event.put("timestamp", LocalDateTime.now().toString());

            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(paymentExchange, payoutProcessedRoutingKey, message);
            
            log.info("Published PayoutProcessedEvent for payout: {}", payout.getId());
        } catch (Exception e) {
            log.error("Failed to publish PayoutProcessedEvent: {}", e.getMessage(), e);
        }
    }

    /**
     * Publish PaymentFailedEvent
     */
    public void publishPaymentFailed(Payment payment, String reason) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "PaymentFailed");
            event.put("paymentId", payment.getId().toString());
            event.put("taskId", payment.getTaskId().toString());
            event.put("buyerId", payment.getBuyerId().toString());
            event.put("amount", payment.getAmount());
            event.put("currency", payment.getCurrency());
            event.put("failureReason", reason);
            event.put("timestamp", LocalDateTime.now().toString());

            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(paymentExchange, "payment.failed", message);
            
            log.info("Published PaymentFailedEvent for payment: {}", payment.getId());
        } catch (Exception e) {
            log.error("Failed to publish PaymentFailedEvent: {}", e.getMessage(), e);
        }
    }

    /**
     * Publish RefundProcessedEvent
     */
    public void publishRefundProcessed(Payment payment, BigDecimal refundAmount) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "RefundProcessed");
            event.put("paymentId", payment.getId().toString());
            event.put("taskId", payment.getTaskId().toString());
            event.put("buyerId", payment.getBuyerId().toString());
            event.put("refundAmount", refundAmount);
            event.put("currency", payment.getCurrency());
            event.put("timestamp", LocalDateTime.now().toString());

            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(paymentExchange, "refund.processed", message);
            
            log.info("Published RefundProcessedEvent for payment: {}", payment.getId());
        } catch (Exception e) {
            log.error("Failed to publish RefundProcessedEvent: {}", e.getMessage(), e);
        }
    }
}
