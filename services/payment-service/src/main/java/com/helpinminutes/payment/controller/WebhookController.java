package com.helpinminutes.payment.controller;

import com.helpinminutes.payment.config.RazorpayClientConfig;
import com.helpinminutes.payment.integration.RazorpayService;
import com.helpinminutes.payment.service.PaymentService;
import com.helpinminutes.payment.service.PayoutService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Hidden // Hide from Swagger as these are internal endpoints
public class WebhookController {

    private final RazorpayService razorpayService;
    private final RazorpayClientConfig razorpayConfig;
    private final PaymentService paymentService;
    private final PayoutService payoutService;

    @PostMapping("/razorpay")
    public ResponseEntity<Void> handleRazorpayWebhook(
            HttpServletRequest request,
            @RequestHeader("X-Razorpay-Signature") String signature) {
        
        log.info("Received Razorpay webhook");

        try {
            // Read request body
            String payload = readRequestBody(request);
            
            // Verify webhook signature
            boolean isValid = razorpayService.verifyWebhookSignature(payload, signature, razorpayConfig.getWebhookSecret());
            
            if (!isValid) {
                log.error("Invalid webhook signature");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Parse webhook payload
            JSONObject webhookData = new JSONObject(payload);
            String event = webhookData.getString("event");
            JSONObject payloadData = webhookData.getJSONObject("payload");

            log.info("Processing Razorpay webhook event: {}", event);

            // Handle different event types
            switch (event) {
                case "payment.captured":
                    handlePaymentCaptured(payloadData);
                    break;
                case "payment.failed":
                    handlePaymentFailed(payloadData);
                    break;
                case "refund.processed":
                    handleRefundProcessed(payloadData);
                    break;
                case "refund.failed":
                    handleRefundFailed(payloadData);
                    break;
                case "payout.processed":
                    handlePayoutProcessed(payloadData);
                    break;
                case "payout.failed":
                    handlePayoutFailed(payloadData);
                    break;
                case "order.paid":
                    handleOrderPaid(payloadData);
                    break;
                default:
                    log.warn("Unhandled webhook event type: {}", event);
            }

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Error processing webhook: {}", e.getMessage(), e);
            // Return 200 to prevent Razorpay from retrying (we'll handle errors internally)
            return ResponseEntity.ok().build();
        }
    }

    /**
     * Handle payment.captured event
     */
    private void handlePaymentCaptured(JSONObject payload) {
        try {
            JSONObject payment = payload.getJSONObject("payment").getJSONObject("entity");
            String razorpayPaymentId = payment.getString("id");
            String orderId = payment.getString("order_id");
            String status = payment.getString("status");

            log.info("Payment captured webhook received: {}, order: {}, status: {}", 
                    razorpayPaymentId, orderId, status);

            // Payment is already captured via API, but we can verify here
            // This is mainly for reconciliation purposes

        } catch (Exception e) {
            log.error("Error handling payment.captured webhook: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle payment.failed event
     */
    private void handlePaymentFailed(JSONObject payload) {
        try {
            JSONObject payment = payload.getJSONObject("payment").getJSONObject("entity");
            String orderId = payment.getString("order_id");
            String errorDescription = payment.optString("error_description", "Unknown error");

            log.error("Payment failed webhook received: order: {}, reason: {}", orderId, errorDescription);

            // Find payment by order ID and mark as failed
            try {
                var paymentResponse = paymentService.getPaymentByOrderId(orderId);
                paymentService.handlePaymentFailure(paymentResponse.getId(), errorDescription);
            } catch (Exception e) {
                log.error("Failed to update payment status for order: {}", orderId, e);
            }

        } catch (Exception e) {
            log.error("Error handling payment.failed webhook: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle refund.processed event
     */
    private void handleRefundProcessed(JSONObject payload) {
        try {
            JSONObject refund = payload.getJSONObject("refund").getJSONObject("entity");
            String refundId = refund.getString("id");
            String paymentId = refund.getString("payment_id");
            String status = refund.getString("status");

            log.info("Refund processed webhook received: {}, payment: {}, status: {}", 
                    refundId, paymentId, status);

            // Refund is already processed via API
            // This is mainly for reconciliation purposes

        } catch (Exception e) {
            log.error("Error handling refund.processed webhook: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle refund.failed event
     */
    private void handleRefundFailed(JSONObject payload) {
        try {
            JSONObject refund = payload.getJSONObject("refund").getJSONObject("entity");
            String refundId = refund.getString("id");
            String errorDescription = refund.optString("error_description", "Unknown error");

            log.error("Refund failed webhook received: {}, reason: {}", refundId, errorDescription);

            // Log for manual investigation
            // In production, you might want to alert support team

        } catch (Exception e) {
            log.error("Error handling refund.failed webhook: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle payout.processed event
     */
    private void handlePayoutProcessed(JSONObject payload) {
        try {
            JSONObject payout = payload.getJSONObject("payout").getJSONObject("entity");
            String payoutId = payout.getString("id");
            String status = payout.getString("status");
            String utr = payout.optString("utr", null);

            log.info("Payout processed webhook received: {}, status: {}, UTR: {}", 
                    payoutId, status, utr);

            // Update payout status
            payoutService.updatePayoutStatus(payoutId, 
                    com.helpinminutes.payment.entity.Payout.PayoutStatus.COMPLETED, utr);

        } catch (Exception e) {
            log.error("Error handling payout.processed webhook: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle payout.failed event
     */
    private void handlePayoutFailed(JSONObject payload) {
        try {
            JSONObject payout = payload.getJSONObject("payout").getJSONObject("entity");
            String payoutId = payout.getString("id");
            String errorDescription = payout.optString("error_description", "Unknown error");

            log.error("Payout failed webhook received: {}, reason: {}", payoutId, errorDescription);

            // Update payout status
            payoutService.updatePayoutStatus(payoutId, 
                    com.helpinminutes.payment.entity.Payout.PayoutStatus.FAILED, null);

        } catch (Exception e) {
            log.error("Error handling payout.failed webhook: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle order.paid event
     */
    private void handleOrderPaid(JSONObject payload) {
        try {
            JSONObject order = payload.getJSONObject("order").getJSONObject("entity");
            String orderId = order.getString("id");
            String status = order.getString("status");

            log.info("Order paid webhook received: {}, status: {}", orderId, status);

            // Order is paid, payment should already be captured
            // This is mainly for reconciliation purposes

        } catch (Exception e) {
            log.error("Error handling order.paid webhook: {}", e.getMessage(), e);
        }
    }

    /**
     * Read request body as string
     */
    private String readRequestBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }
}
