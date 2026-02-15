package com.helpinminutes.payment.service;

import com.helpinminutes.payment.dto.CashPaymentRequest;
import com.helpinminutes.payment.dto.CashPaymentVerifyRequest;
import com.helpinminutes.payment.dto.PaymentResponse;
import com.helpinminutes.payment.entity.Payment;
import com.helpinminutes.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class CashPaymentService {

    private final PaymentRepository paymentRepository;
    private final TaxCalculationService taxCalculationService;
    private final LedgerService ledgerService;
    private final StringRedisTemplate redisTemplate;

    private static final String OTP_PREFIX = "cash_payment:otp:";
    private static final String OTP_ATTEMPTS_PREFIX = "cash_payment:attempts:";
    private static final long OTP_TTL_MINUTES = 10;
    private static final int MAX_OTP_ATTEMPTS = 3;
    private static final int OTP_LENGTH = 6;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Initiate cash payment - creates payment record and generates OTP
     */
    @Transactional
    public PaymentResponse initiateCashPayment(CashPaymentRequest request) {
        log.info("Initiating cash payment for task: {}, buyer: {}, helper: {}", 
                request.getTaskId(), request.getBuyerId(), request.getHelperId());

        // Calculate financial breakdown
        TaxCalculationService.FinancialBreakdown breakdown = 
                taxCalculationService.calculateFinancialBreakdown(request.getAmount());

        // Generate order ID
        String orderId = "cash_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // Create payment record
        Payment payment = Payment.builder()
                .taskId(request.getTaskId())
                .buyerId(request.getBuyerId())
                .helperId(request.getHelperId())
                .orderId(orderId)
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(Payment.PaymentStatus.PENDING)
                .provider(Payment.PaymentProvider.RAZORPAY) // Using RAZORPAY as default provider
                .platformFee(breakdown.getPlatformFee())
                .helperAmount(breakdown.getHelperPayout())
                .taxAmount(breakdown.getGst())
                .build();

        payment = paymentRepository.save(payment);

        // Generate and store OTP
        String otp = generateOtp();
        String otpKey = OTP_PREFIX + payment.getId();
        redisTemplate.opsForValue().set(otpKey, otp, OTP_TTL_MINUTES, TimeUnit.MINUTES);

        // Initialize attempts counter
        String attemptsKey = OTP_ATTEMPTS_PREFIX + payment.getId();
        redisTemplate.opsForValue().set(attemptsKey, "0", OTP_TTL_MINUTES, TimeUnit.MINUTES);

        // In a real implementation, send OTP via SMS to helper
        // For testing purposes, we'll log it
        log.info("Cash payment OTP generated for payment: {} - OTP: {}", payment.getId(), otp);

        return mapToResponse(payment);
    }

    /**
     * Verify cash payment OTP
     */
    @Transactional
    public PaymentResponse verifyCashPayment(CashPaymentVerifyRequest request) {
        log.info("Verifying cash payment: {}", request.getPaymentId());

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Payment not found: " + request.getPaymentId()));

        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            throw new RuntimeException("Payment is not in PENDING status");
        }

        String otpKey = OTP_PREFIX + payment.getId();
        String attemptsKey = OTP_ATTEMPTS_PREFIX + payment.getId();

        // Check attempts
        String attemptsStr = redisTemplate.opsForValue().get(attemptsKey);
        int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;

        if (attempts >= MAX_OTP_ATTEMPTS) {
            log.warn("Max OTP attempts exceeded for payment: {}", payment.getId());
            throw new RuntimeException("Maximum OTP attempts exceeded. Please request a new OTP.");
        }

        // Verify OTP
        String storedOtp = redisTemplate.opsForValue().get(otpKey);
        
        if (storedOtp == null) {
            log.warn("OTP expired for payment: {}", payment.getId());
            throw new RuntimeException("OTP has expired. Please request a new OTP.");
        }

        if (!storedOtp.equals(request.getOtp())) {
            // Increment attempts
            attempts++;
            redisTemplate.opsForValue().set(attemptsKey, String.valueOf(attempts), 
                    OTP_TTL_MINUTES, TimeUnit.MINUTES);
            
            int remainingAttempts = MAX_OTP_ATTEMPTS - attempts;
            log.warn("Invalid OTP for payment: {}. Remaining attempts: {}", payment.getId(), remainingAttempts);
            
            throw new RuntimeException("Invalid OTP. " + remainingAttempts + " attempts remaining.");
        }

        // OTP verified successfully
        // Update payment status
        payment.setStatus(Payment.PaymentStatus.CAPTURED);
        payment.setCapturedAt(LocalDateTime.now());
        payment.setProviderPaymentId("CASH_" + UUID.randomUUID().toString().substring(0, 8));
        payment = paymentRepository.save(payment);

        // Create ledger entries
        createLedgerEntriesForCashPayment(payment);

        // Clean up Redis keys
        redisTemplate.delete(otpKey);
        redisTemplate.delete(attemptsKey);

        log.info("Cash payment verified successfully: {}", payment.getId());
        return mapToResponse(payment);
    }

    /**
     * Resend OTP for cash payment
     */
    public void resendOtp(UUID paymentId) {
        log.info("Resending OTP for cash payment: {}", paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            throw new RuntimeException("Payment is not in PENDING status");
        }

        // Generate new OTP
        String otp = generateOtp();
        String otpKey = OTP_PREFIX + paymentId;
        
        // Reset OTP and attempts
        redisTemplate.opsForValue().set(otpKey, otp, OTP_TTL_MINUTES, TimeUnit.MINUTES);
        
        String attemptsKey = OTP_ATTEMPTS_PREFIX + paymentId;
        redisTemplate.opsForValue().set(attemptsKey, "0", OTP_TTL_MINUTES, TimeUnit.MINUTES);

        // In a real implementation, send OTP via SMS to helper
        log.info("New OTP generated for payment: {} - OTP: {}", paymentId, otp);
    }

    /**
     * Generate a random 6-digit OTP
     */
    private String generateOtp() {
        int otp = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Create ledger entries for cash payment
     */
    private void createLedgerEntriesForCashPayment(Payment payment) {
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

        // Social security entry
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
    private PaymentResponse mapToResponse(Payment payment) {
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
