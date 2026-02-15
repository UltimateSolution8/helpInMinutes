package com.helpinminutes.payment.service;

import com.helpinminutes.payment.dto.RefundRequest;
import com.helpinminutes.payment.dto.RefundResponse;
import com.helpinminutes.payment.entity.Payment;
import com.helpinminutes.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundService {

    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Value("${app.payment.refund-window-days:7}")
    private int refundWindowDays;

    /**
     * Check if a payment is eligible for refund
     */
    public boolean isEligibleForRefund(Payment payment) {
        // Payment must be captured
        if (payment.getStatus() != Payment.PaymentStatus.CAPTURED && 
            payment.getStatus() != Payment.PaymentStatus.PARTIALLY_REFUNDED) {
            log.warn("Payment {} is not eligible for refund. Status: {}", 
                    payment.getId(), payment.getStatus());
            return false;
        }

        // Check refund window
        LocalDateTime refundDeadline = payment.getCapturedAt().plus(refundWindowDays, ChronoUnit.DAYS);
        if (LocalDateTime.now().isAfter(refundDeadline)) {
            log.warn("Payment {} is outside refund window. Deadline: {}", 
                    payment.getId(), refundDeadline);
            return false;
        }

        // Check if fully refunded
        if (payment.getStatus() == Payment.PaymentStatus.REFUNDED) {
            log.warn("Payment {} is already fully refunded", payment.getId());
            return false;
        }

        return true;
    }

    /**
     * Calculate maximum refundable amount
     */
    public BigDecimal getMaximumRefundableAmount(Payment payment) {
        if (payment.getRefundAmount() == null) {
            return payment.getAmount();
        }
        return payment.getAmount().subtract(payment.getRefundAmount());
    }

    /**
     * Process refund with eligibility checks
     */
    @Transactional
    public RefundResponse processRefundWithChecks(RefundRequest request) {
        log.info("Processing refund with checks for payment: {}", request.getPaymentId());

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Payment not found: " + request.getPaymentId()));

        // Check eligibility
        if (!isEligibleForRefund(payment)) {
            throw new RuntimeException("Payment is not eligible for refund");
        }

        // Validate refund amount
        BigDecimal maxRefundable = getMaximumRefundableAmount(payment);
        BigDecimal refundAmount = request.isFullRefund() ? maxRefundable : request.getAmount();

        if (refundAmount.compareTo(maxRefundable) > 0) {
            throw new RuntimeException("Refund amount exceeds maximum refundable amount: " + maxRefundable);
        }

        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Refund amount must be greater than zero");
        }

        // Update request with validated amount if full refund
        RefundRequest finalRequest = request;
        if (request.isFullRefund()) {
            finalRequest = RefundRequest.builder()
                    .paymentId(request.getPaymentId())
                    .amount(maxRefundable)
                    .reason(request.getReason())
                    .fullRefund(true)
                    .idempotencyKey(request.getIdempotencyKey())
                    .build();
        }

        // Process refund through payment service
        return paymentService.processRefund(finalRequest);
    }

    /**
     * Get refund status/details
     */
    public RefundResponse getRefundStatus(java.util.UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (payment.getRefundAmount() == null) {
            throw new RuntimeException("No refund found for payment: " + paymentId);
        }

        return RefundResponse.builder()
                .id(java.util.UUID.randomUUID())
                .paymentId(paymentId)
                .amount(payment.getRefundAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().name())
                .reason(payment.getRefundReason())
                .processedAt(payment.getRefundedAt())
                .createdAt(payment.getRefundedAt())
                .build();
    }
}
