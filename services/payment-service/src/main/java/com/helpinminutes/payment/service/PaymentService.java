package com.helpinminutes.payment.service;

import com.helpinminutes.payment.dto.*;
import com.helpinminutes.payment.entity.Payment;
import com.helpinminutes.payment.integration.RazorpayService;
import com.helpinminutes.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RazorpayService razorpayService;
    private final TaxCalculationService taxCalculationService;
    private final LedgerService ledgerService;
    private final StringRedisTemplate redisTemplate;

    private static final String IDEMPOTENCY_KEY_PREFIX = "payment:idempotency:";
    private static final long IDEMPOTENCY_TTL_HOURS = 24;

    /**
     * Create a new payment order
     */
    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        log.info("Creating payment order for task: {}, buyer: {}", request.getTaskId(), request.getBuyerId());

        // Calculate financial breakdown
        TaxCalculationService.FinancialBreakdown breakdown = 
                taxCalculationService.calculateFinancialBreakdown(request.getAmount());

        // Generate order ID
        String orderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // Create payment record
        Payment payment = Payment.builder()
                .taskId(request.getTaskId())
                .buyerId(request.getBuyerId())
                .helperId(request.getHelperId())
                .orderId(orderId)
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(Payment.PaymentStatus.PENDING)
                .provider(Payment.PaymentProvider.RAZORPAY)
                .platformFee(breakdown.getPlatformFee())
                .helperAmount(breakdown.getHelperPayout())
                .taxAmount(breakdown.getGst())
                .build();

        payment = paymentRepository.save(payment);

        // Create Razorpay order
        CreateOrderResponse response = razorpayService.createOrder(request, payment.getId(), orderId);

        // Update payment with Razorpay order ID
        payment.setProviderOrderId(response.getRazorpayOrderId());
        paymentRepository.save(payment);

        log.info("Payment order created successfully: {}", payment.getId());
        return response;
    }

    /**
     * Capture payment after successful payment from frontend
     */
    @Transactional
    public PaymentResponse capturePayment(PaymentCaptureRequest request) {
        log.info("Capturing payment: {}", request.getPaymentId());

        // Check idempotency
        if (request.getIdempotencyKey() != null) {
            String idempotencyKey = IDEMPOTENCY_KEY_PREFIX + request.getIdempotencyKey();
            String existingPayment = redisTemplate.opsForValue().get(idempotencyKey);
            if (existingPayment != null) {
                log.info("Payment capture already processed for idempotency key: {}", request.getIdempotencyKey());
                return getPayment(request.getPaymentId());
            }
        }

        // Find payment
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Payment not found: " + request.getPaymentId()));

        // Verify signature
        boolean isValidSignature = razorpayService.verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!isValidSignature) {
            log.error("Invalid payment signature for payment: {}", request.getPaymentId());
            throw new RuntimeException("Invalid payment signature");
        }

        // Capture payment in Razorpay
        com.razorpay.Payment razorpayPayment = razorpayService.capturePayment(
                request.getRazorpayPaymentId(),
                payment.getAmount(),
                payment.getCurrency()
        );

        // Update payment record
        payment.setProviderPaymentId(request.getRazorpayPaymentId());
        payment.setProviderSignature(request.getRazorpaySignature());
        payment.setProviderResponse(razorpayPayment.toString());
        payment.setStatus(Payment.PaymentStatus.CAPTURED);
        payment.setCapturedAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        // Create ledger entries
        createLedgerEntriesForCapturedPayment(payment);

        // Store idempotency key
        if (request.getIdempotencyKey() != null) {
            String idempotencyKey = IDEMPOTENCY_KEY_PREFIX + request.getIdempotencyKey();
            redisTemplate.opsForValue().set(idempotencyKey, payment.getId().toString(), 
                    IDEMPOTENCY_TTL_HOURS, TimeUnit.HOURS);
        }

        log.info("Payment captured successfully: {}", payment.getId());
        return mapToResponse(payment);
    }

    /**
     * Get payment by ID
     */
    public PaymentResponse getPayment(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        return mapToResponse(payment);
    }

    /**
     * Get payment by order ID
     */
    public PaymentResponse getPaymentByOrderId(String orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));
        return mapToResponse(payment);
    }

    /**
     * Process refund
     */
    @Transactional
    public RefundResponse processRefund(RefundRequest request) {
        log.info("Processing refund for payment: {}", request.getPaymentId());

        // Check idempotency
        if (request.getIdempotencyKey() != null) {
            String idempotencyKey = IDEMPOTENCY_KEY_PREFIX + "refund:" + request.getIdempotencyKey();
            String existingRefund = redisTemplate.opsForValue().get(idempotencyKey);
            if (existingRefund != null) {
                log.info("Refund already processed for idempotency key: {}", request.getIdempotencyKey());
                throw new RuntimeException("Refund already processed");
            }
        }

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Payment not found: " + request.getPaymentId()));

        if (payment.getStatus() != Payment.PaymentStatus.CAPTURED) {
            throw new RuntimeException("Payment is not in CAPTURED status");
        }

        // Calculate refund amount
        BigDecimal refundAmount = request.isFullRefund() ? payment.getAmount() : request.getAmount();
        
        if (refundAmount.compareTo(payment.getAmount()) > 0) {
            throw new RuntimeException("Refund amount cannot exceed payment amount");
        }

        // Create refund in Razorpay
        RefundResponse refundResponse = razorpayService.createRefund(request, payment.getProviderPaymentId());

        // Update payment record
        payment.setRefundAmount(refundAmount);
        payment.setRefundReason(request.getReason());
        payment.setRefundedAt(LocalDateTime.now());
        
        if (refundAmount.compareTo(payment.getAmount()) == 0) {
            payment.setStatus(Payment.PaymentStatus.REFUNDED);
        } else {
            payment.setStatus(Payment.PaymentStatus.PARTIALLY_REFUNDED);
        }
        
        paymentRepository.save(payment);

        // Create refund ledger entry
        ledgerService.createRefundEntry(payment, refundAmount, request.getReason());

        // Store idempotency key
        if (request.getIdempotencyKey() != null) {
            String idempotencyKey = IDEMPOTENCY_KEY_PREFIX + "refund:" + request.getIdempotencyKey();
            redisTemplate.opsForValue().set(idempotencyKey, refundResponse.getId().toString(), 
                    IDEMPOTENCY_TTL_HOURS, TimeUnit.HOURS);
        }

        log.info("Refund processed successfully: {}", refundResponse.getId());
        return refundResponse;
    }

    /**
     * Handle payment failure (from webhook or status check)
     */
    @Transactional
    public void handlePaymentFailure(UUID paymentId, String reason) {
        log.info("Handling payment failure for: {}, reason: {}", paymentId, reason);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        payment.setStatus(Payment.PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        payment.setFailedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        log.info("Payment marked as failed: {}", paymentId);
    }

    /**
     * Create ledger entries for a captured payment
     */
    private void createLedgerEntriesForCapturedPayment(com.helpinminutes.payment.entity.Payment payment) {
        // Platform fee entry
        if (payment.getPlatformFee() != null && payment.getPlatformFee().compareTo(BigDecimal.ZERO) > 0) {
            ledgerService.createPlatformFeeEntry(payment, payment.getPlatformFee());
        }

        // Tax entry
        if (payment.getTaxAmount() != null && payment.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            ledgerService.createTaxEntry(payment, payment.getTaxAmount());
        }

        // Helper payout entry
        if (payment.getHelperAmount() != null && payment.getHelperAmount().compareTo(BigDecimal.ZERO) > 0) {
            ledgerService.createHelperPayoutEntry(payment, payment.getHelperId(), payment.getHelperAmount());
        }

        // Social security entry (calculated from helper amount)
        if (payment.getHelperAmount() != null) {
            BigDecimal socialSecurity = taxCalculationService.calculateSocialSecurity(payment.getHelperAmount());
            if (socialSecurity.compareTo(BigDecimal.ZERO) > 0) {
                ledgerService.createSocialSecurityEntry(payment, socialSecurity);
            }
        }
    }

    /**
     * Map Payment entity to PaymentResponse DTO
     */
    private PaymentResponse mapToResponse(com.helpinminutes.payment.entity.Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .taskId(payment.getTaskId())
                .buyerId(payment.getBuyerId())
                .helperId(payment.getHelperId())
                .orderId(payment.getOrderId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().name())
                .provider(payment.getProvider().name())
                .providerPaymentId(payment.getProviderPaymentId())
                .providerOrderId(payment.getProviderOrderId())
                .platformFee(payment.getPlatformFee())
                .helperAmount(payment.getHelperAmount())
                .taxAmount(payment.getTaxAmount())
                .failureReason(payment.getFailureReason())
                .failedAt(payment.getFailedAt())
                .capturedAt(payment.getCapturedAt())
                .refundedAt(payment.getRefundedAt())
                .refundAmount(payment.getRefundAmount())
                .refundReason(payment.getRefundReason())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
