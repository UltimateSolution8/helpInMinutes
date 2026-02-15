package com.helpinminutes.payment.service;

import com.helpinminutes.payment.dto.PayoutRequest;
import com.helpinminutes.payment.dto.PayoutResponse;
import com.helpinminutes.payment.entity.Payment;
import com.helpinminutes.payment.entity.Payout;
import com.helpinminutes.payment.repository.PaymentRepository;
import com.helpinminutes.payment.repository.PayoutRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayoutService {

    private final PayoutRepository payoutRepository;
    private final PaymentRepository paymentRepository;
    private final LedgerService ledgerService;
    private final StringRedisTemplate redisTemplate;

    private static final String IDEMPOTENCY_KEY_PREFIX = "payout:idempotency:";
    private static final long IDEMPOTENCY_TTL_HOURS = 24;

    /**
     * Create a new payout to helper
     */
    @Transactional
    public PayoutResponse createPayout(PayoutRequest request) {
        log.info("Creating payout for helper: {}, task: {}, amount: {}", 
                request.getHelperId(), request.getTaskId(), request.getAmount());

        // Check idempotency
        if (request.getIdempotencyKey() != null) {
            String idempotencyKey = IDEMPOTENCY_KEY_PREFIX + request.getIdempotencyKey();
            String existingPayout = redisTemplate.opsForValue().get(idempotencyKey);
            if (existingPayout != null) {
                log.info("Payout already processed for idempotency key: {}", request.getIdempotencyKey());
                return getPayout(UUID.fromString(existingPayout));
            }
        }

        // Verify payment exists and is captured
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Payment not found: " + request.getPaymentId()));

        if (payment.getStatus() != Payment.PaymentStatus.CAPTURED) {
            throw new RuntimeException("Payment is not in CAPTURED status");
        }

        // Check if payout already exists for this payment
        if (payoutRepository.existsByPaymentId(request.getPaymentId())) {
            throw new RuntimeException("Payout already exists for payment: " + request.getPaymentId());
        }

        // Create bank account details
        Payout.BankAccountDetails bankAccount = Payout.BankAccountDetails.builder()
                .accountNumber(maskAccountNumber(request.getAccountNumber()))
                .ifscCode(request.getIfscCode())
                .accountHolderName(request.getAccountHolderName())
                .bankName(request.getBankName())
                .build();

        // Create payout record
        Payout payout = Payout.builder()
                .helperId(request.getHelperId())
                .taskId(request.getTaskId())
                .paymentId(request.getPaymentId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(Payout.PayoutStatus.PENDING)
                .provider(Payout.PayoutProvider.RAZORPAYX)
                .bankAccount(bankAccount)
                .retryCount(0)
                .build();

        payout = payoutRepository.save(payout);

        // Process payout (in real implementation, this would call RazorpayX API)
        processPayout(payout, request);

        // Store idempotency key
        if (request.getIdempotencyKey() != null) {
            String idempotencyKey = IDEMPOTENCY_KEY_PREFIX + request.getIdempotencyKey();
            redisTemplate.opsForValue().set(idempotencyKey, payout.getId().toString(), 
                    IDEMPOTENCY_TTL_HOURS, TimeUnit.HOURS);
        }

        log.info("Payout created successfully: {}", payout.getId());
        return mapToResponse(payout);
    }

    /**
     * Get payout by ID
     */
    public PayoutResponse getPayout(UUID payoutId) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new RuntimeException("Payout not found: " + payoutId));
        return mapToResponse(payout);
    }

    /**
     * Process payout (simulate RazorpayX payout)
     * In production, this would call the actual RazorpayX API
     */
    @Transactional
    public void processPayout(Payout payout, PayoutRequest request) {
        log.info("Processing payout: {}", payout.getId());

        try {
            // Simulate RazorpayX payout creation
            // In production: razorpayClient.payouts.create(payoutRequest);
            
            String providerPayoutId = "pout_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            
            payout.setProviderPayoutId(providerPayoutId);
            payout.setStatus(Payout.PayoutStatus.PROCESSING);
            payout.setProcessedAt(LocalDateTime.now());
            
            // Simulate async processing
            // In production, the actual status would be updated via webhook
            payout.setStatus(Payout.PayoutStatus.COMPLETED);
            payout.setSettledAt(LocalDateTime.now());
            payout.setUtrNumber("UTR" + System.currentTimeMillis());
            
            payoutRepository.save(payout);

            log.info("Payout processed successfully: {}", payout.getId());

        } catch (Exception e) {
            log.error("Failed to process payout: {}", e.getMessage(), e);
            payout.setStatus(Payout.PayoutStatus.FAILED);
            payout.setFailureReason(e.getMessage());
            payout.setRetryCount(payout.getRetryCount() + 1);
            payoutRepository.save(payout);
            throw new RuntimeException("Failed to process payout: " + e.getMessage(), e);
        }
    }

    /**
     * Retry a failed payout
     */
    @Transactional
    public PayoutResponse retryPayout(UUID payoutId) {
        log.info("Retrying payout: {}", payoutId);

        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new RuntimeException("Payout not found: " + payoutId));

        if (payout.getStatus() != Payout.PayoutStatus.FAILED) {
            throw new RuntimeException("Only failed payouts can be retried");
        }

        if (payout.getRetryCount() >= 3) {
            throw new RuntimeException("Maximum retry attempts exceeded for payout: " + payoutId);
        }

        // Reset status and retry
        payout.setStatus(Payout.PayoutStatus.PENDING);
        payout.setFailureReason(null);
        payoutRepository.save(payout);

        // Re-process
        PayoutRequest request = PayoutRequest.builder()
                .helperId(payout.getHelperId())
                .taskId(payout.getTaskId())
                .paymentId(payout.getPaymentId())
                .amount(payout.getAmount())
                .currency(payout.getCurrency())
                .accountNumber(payout.getBankAccount().getAccountNumber())
                .ifscCode(payout.getBankAccount().getIfscCode())
                .accountHolderName(payout.getBankAccount().getAccountHolderName())
                .bankName(payout.getBankAccount().getBankName())
                .build();

        processPayout(payout, request);

        return mapToResponse(payout);
    }

    /**
     * Update payout status from webhook
     */
    @Transactional
    public void updatePayoutStatus(String providerPayoutId, Payout.PayoutStatus status, String utrNumber) {
        log.info("Updating payout status: {}, status: {}", providerPayoutId, status);

        Payout payout = payoutRepository.findByProviderPayoutId(providerPayoutId)
                .orElseThrow(() -> new RuntimeException("Payout not found: " + providerPayoutId));

        payout.setStatus(status);
        
        if (status == Payout.PayoutStatus.COMPLETED) {
            payout.setSettledAt(LocalDateTime.now());
            payout.setUtrNumber(utrNumber);
        }

        payoutRepository.save(payout);
        log.info("Payout status updated: {} -> {}", providerPayoutId, status);
    }

    /**
     * Mask account number for security
     */
    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return accountNumber;
        }
        return "XXXX" + accountNumber.substring(accountNumber.length() - 4);
    }

    /**
     * Map Payout entity to PayoutResponse DTO
     */
    private PayoutResponse mapToResponse(Payout payout) {
        return PayoutResponse.builder()
                .id(payout.getId())
                .helperId(payout.getHelperId())
                .taskId(payout.getTaskId())
                .paymentId(payout.getPaymentId())
                .amount(payout.getAmount())
                .currency(payout.getCurrency())
                .status(payout.getStatus().name())
                .provider(payout.getProvider().name())
                .providerPayoutId(payout.getProviderPayoutId())
                .utrNumber(payout.getUtrNumber())
                .failureReason(payout.getFailureReason())
                .processedAt(payout.getProcessedAt())
                .settledAt(payout.getSettledAt())
                .retryCount(payout.getRetryCount())
                .createdAt(payout.getCreatedAt())
                .updatedAt(payout.getUpdatedAt())
                .build();
    }
}
