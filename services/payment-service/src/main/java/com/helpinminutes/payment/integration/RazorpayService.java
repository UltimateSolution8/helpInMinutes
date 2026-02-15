package com.helpinminutes.payment.integration;

import com.helpinminutes.payment.config.RazorpayClientConfig;
import com.helpinminutes.payment.dto.CreateOrderRequest;
import com.helpinminutes.payment.dto.CreateOrderResponse;
import com.helpinminutes.payment.dto.RefundRequest;
import com.helpinminutes.payment.dto.RefundResponse;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.Refund;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final RazorpayClient razorpayClient;
    private final RazorpayClientConfig razorpayConfig;

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String ORDER_RECEIPT_PREFIX = "receipt_";

    /**
     * Create a new Razorpay order
     */
    public CreateOrderResponse createOrder(CreateOrderRequest request, UUID paymentId, String orderId) {
        try {
            log.info("Creating Razorpay order for payment: {}, amount: {}", paymentId, request.getAmount());

            JSONObject orderRequest = new JSONObject();
            // Convert amount to paise (Razorpay expects amount in smallest currency unit)
            int amountInPaise = request.getAmount().multiply(BigDecimal.valueOf(100)).intValue();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", request.getCurrency());
            orderRequest.put("receipt", ORDER_RECEIPT_PREFIX + orderId);

            // Add notes
            JSONObject notes = new JSONObject();
            notes.put("task_id", request.getTaskId().toString());
            notes.put("payment_id", paymentId.toString());
            notes.put("buyer_id", request.getBuyerId().toString());
            if (request.getHelperId() != null) {
                notes.put("helper_id", request.getHelperId().toString());
            }
            if (request.getNotes() != null) {
                notes.put("notes", request.getNotes());
            }
            orderRequest.put("notes", notes);

            // Create order
            Order order = razorpayClient.orders.create(orderRequest);

            String razorpayOrderId = order.get("id");
            String status = order.get("status");

            log.info("Razorpay order created successfully: {}, status: {}", razorpayOrderId, status);

            return CreateOrderResponse.builder()
                    .paymentId(paymentId)
                    .orderId(orderId)
                    .razorpayOrderId(razorpayOrderId)
                    .taskId(request.getTaskId())
                    .buyerId(request.getBuyerId())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .status(status)
                    .keyId(razorpayConfig.getKeyId())
                    .build();

        } catch (Exception e) {
            log.error("Failed to create Razorpay order: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage(), e);
        }
    }

    /**
     * Fetch payment details from Razorpay
     */
    public Payment fetchPayment(String paymentId) {
        try {
            log.info("Fetching Razorpay payment: {}", paymentId);
            return razorpayClient.payments.fetch(paymentId);
        } catch (Exception e) {
            log.error("Failed to fetch Razorpay payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch payment: " + e.getMessage(), e);
        }
    }

    /**
     * Capture an authorized payment
     */
    public Payment capturePayment(String razorpayPaymentId, BigDecimal amount, String currency) {
        try {
            log.info("Capturing Razorpay payment: {}, amount: {}", razorpayPaymentId, amount);

            JSONObject captureRequest = new JSONObject();
            int amountInPaise = amount.multiply(BigDecimal.valueOf(100)).intValue();
            captureRequest.put("amount", amountInPaise);
            captureRequest.put("currency", currency);

            Payment payment = razorpayClient.payments.capture(razorpayPaymentId, captureRequest);
            String status = payment.get("status");
            log.info("Payment captured successfully: {}", status);

            return payment;
        } catch (Exception e) {
            log.error("Failed to capture Razorpay payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to capture payment: " + e.getMessage(), e);
        }
    }

    /**
     * Create a refund for a payment
     */
    public RefundResponse createRefund(RefundRequest request, String razorpayPaymentId) {
        try {
            log.info("Creating refund for payment: {}, amount: {}", request.getPaymentId(), 
                    request.isFullRefund() ? "full" : request.getAmount());

            JSONObject refundRequest = new JSONObject();
            
            if (!request.isFullRefund() && request.getAmount() != null) {
                int amountInPaise = request.getAmount().multiply(BigDecimal.valueOf(100)).intValue();
                refundRequest.put("amount", amountInPaise);
            }
            
            if (request.getReason() != null) {
                refundRequest.put("notes", new JSONObject().put("reason", request.getReason()));
            }

            Refund refund = razorpayClient.payments.refund(razorpayPaymentId, refundRequest);

            String refundId = refund.get("id");
            String status = refund.get("status");
            BigDecimal refundAmount = new BigDecimal(refund.get("amount").toString())
                    .divide(BigDecimal.valueOf(100));

            log.info("Refund created successfully: {}, status: {}", refundId, status);

            return RefundResponse.builder()
                    .id(UUID.randomUUID())
                    .paymentId(request.getPaymentId())
                    .providerRefundId(refundId)
                    .amount(refundAmount)
                    .currency("INR")
                    .status(status)
                    .reason(request.getReason())
                    .build();

        } catch (Exception e) {
            log.error("Failed to create Razorpay refund: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create refund: " + e.getMessage(), e);
        }
    }

    /**
     * Verify webhook signature
     */
    public boolean verifyWebhookSignature(String payload, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);

            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = Base64.getEncoder().encodeToString(hash);

            boolean isValid = signature.equals(expectedSignature);
            log.debug("Webhook signature verification result: {}", isValid);
            
            return isValid;
        } catch (Exception e) {
            log.error("Failed to verify webhook signature: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Verify payment signature (for frontend callback verification)
     */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    razorpayConfig.getKeySecret().getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);

            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = Base64.getEncoder().encodeToString(hash);

            boolean isValid = signature.equals(expectedSignature);
            log.info("Payment signature verification result: {}", isValid);
            
            return isValid;
        } catch (Exception e) {
            log.error("Failed to verify payment signature: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Fetch order details from Razorpay
     */
    public Order fetchOrder(String orderId) {
        try {
            log.info("Fetching Razorpay order: {}", orderId);
            return razorpayClient.orders.fetch(orderId);
        } catch (Exception e) {
            log.error("Failed to fetch Razorpay order: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch order: " + e.getMessage(), e);
        }
    }
}
