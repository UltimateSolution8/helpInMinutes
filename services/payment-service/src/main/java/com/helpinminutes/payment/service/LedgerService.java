package com.helpinminutes.payment.service;

import com.helpinminutes.payment.dto.LedgerEntryResponse;
import com.helpinminutes.payment.entity.LedgerEntry;
import com.helpinminutes.payment.entity.Payment;
import com.helpinminutes.payment.repository.LedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerEntryRepository ledgerEntryRepository;

    /**
     * Create a ledger entry for platform fee
     */
    @Transactional
    public LedgerEntry createPlatformFeeEntry(Payment payment, BigDecimal amount) {
        log.info("Creating platform fee ledger entry for payment: {}, amount: {}", payment.getId(), amount);
        
        LedgerEntry entry = LedgerEntry.builder()
                .payment(payment)
                .taskId(payment.getTaskId())
                .entryType(LedgerEntry.LedgerEntryType.PLATFORM_FEE)
                .amount(amount)
                .currency(payment.getCurrency())
                .description("Platform fee for task " + payment.getTaskId())
                .referenceId(payment.getProviderPaymentId())
                .referenceType("RAZORPAY_PAYMENT")
                .build();

        return ledgerEntryRepository.save(entry);
    }

    /**
     * Create a ledger entry for helper payout
     */
    @Transactional
    public LedgerEntry createHelperPayoutEntry(Payment payment, UUID helperId, BigDecimal amount) {
        log.info("Creating helper payout ledger entry for payment: {}, helper: {}, amount: {}", 
                payment.getId(), helperId, amount);
        
        LedgerEntry entry = LedgerEntry.builder()
                .payment(payment)
                .taskId(payment.getTaskId())
                .userId(helperId)
                .entryType(LedgerEntry.LedgerEntryType.HELPER_PAYOUT)
                .amount(amount)
                .currency(payment.getCurrency())
                .description("Helper payout for task " + payment.getTaskId())
                .referenceId(payment.getProviderPaymentId())
                .referenceType("RAZORPAY_PAYMENT")
                .build();

        return ledgerEntryRepository.save(entry);
    }

    /**
     * Create a ledger entry for social security
     */
    @Transactional
    public LedgerEntry createSocialSecurityEntry(Payment payment, BigDecimal amount) {
        log.info("Creating social security ledger entry for payment: {}, amount: {}", payment.getId(), amount);
        
        LedgerEntry entry = LedgerEntry.builder()
                .payment(payment)
                .taskId(payment.getTaskId())
                .entryType(LedgerEntry.LedgerEntryType.SOCIAL_SECURITY)
                .amount(amount)
                .currency(payment.getCurrency())
                .description("Social security reserve for task " + payment.getTaskId())
                .referenceId(payment.getProviderPaymentId())
                .referenceType("RAZORPAY_PAYMENT")
                .build();

        return ledgerEntryRepository.save(entry);
    }

    /**
     * Create a ledger entry for tax
     */
    @Transactional
    public LedgerEntry createTaxEntry(Payment payment, BigDecimal amount) {
        log.info("Creating tax ledger entry for payment: {}, amount: {}", payment.getId(), amount);
        
        LedgerEntry entry = LedgerEntry.builder()
                .payment(payment)
                .taskId(payment.getTaskId())
                .entryType(LedgerEntry.LedgerEntryType.TAX)
                .amount(amount)
                .currency(payment.getCurrency())
                .description("GST on platform fee for task " + payment.getTaskId())
                .referenceId(payment.getProviderPaymentId())
                .referenceType("RAZORPAY_PAYMENT")
                .build();

        return ledgerEntryRepository.save(entry);
    }

    /**
     * Create a ledger entry for refund
     */
    @Transactional
    public LedgerEntry createRefundEntry(Payment payment, BigDecimal amount, String reason) {
        log.info("Creating refund ledger entry for payment: {}, amount: {}", payment.getId(), amount);
        
        LedgerEntry entry = LedgerEntry.builder()
                .payment(payment)
                .taskId(payment.getTaskId())
                .userId(payment.getBuyerId())
                .entryType(LedgerEntry.LedgerEntryType.REFUND)
                .amount(amount.negate()) // Negative amount for refund
                .currency(payment.getCurrency())
                .description("Refund: " + (reason != null ? reason : "Customer refund"))
                .referenceId(payment.getProviderPaymentId())
                .referenceType("RAZORPAY_REFUND")
                .build();

        return ledgerEntryRepository.save(entry);
    }

    /**
     * Reverse a ledger entry
     */
    @Transactional
    public void reverseEntry(UUID entryId, String reason) {
        log.info("Reversing ledger entry: {}, reason: {}", entryId, reason);
        
        LedgerEntry entry = ledgerEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Ledger entry not found: " + entryId));
        
        entry.setIsReversed(true);
        entry.setReversedAt(LocalDateTime.now());
        entry.setReversalReason(reason);
        
        ledgerEntryRepository.save(entry);
    }

    /**
     * Get all ledger entries for a payment
     */
    public List<LedgerEntryResponse> getEntriesByPayment(UUID paymentId) {
        List<LedgerEntry> entries = ledgerEntryRepository.findByPaymentId(paymentId);
        return entries.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all ledger entries for a task
     */
    public List<LedgerEntryResponse> getEntriesByTask(UUID taskId) {
        List<LedgerEntry> entries = ledgerEntryRepository.findByTaskId(taskId);
        return entries.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all ledger entries for a user
     */
    public List<LedgerEntryResponse> getEntriesByUser(UUID userId) {
        List<LedgerEntry> entries = ledgerEntryRepository.findByUserId(userId);
        return entries.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Calculate total amount for a specific entry type
     */
    public BigDecimal getTotalByEntryType(LedgerEntry.LedgerEntryType entryType) {
        BigDecimal total = ledgerEntryRepository.sumAmountByEntryType(entryType);
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Map LedgerEntry entity to LedgerEntryResponse DTO
     */
    private LedgerEntryResponse mapToResponse(LedgerEntry entry) {
        return LedgerEntryResponse.builder()
                .id(entry.getId())
                .paymentId(entry.getPayment().getId())
                .taskId(entry.getTaskId())
                .userId(entry.getUserId())
                .entryType(entry.getEntryType().name())
                .amount(entry.getAmount())
                .currency(entry.getCurrency())
                .description(entry.getDescription())
                .referenceId(entry.getReferenceId())
                .referenceType(entry.getReferenceType())
                .isReversed(entry.getIsReversed())
                .reversedAt(entry.getReversedAt())
                .reversalReason(entry.getReversalReason())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
