package com.helpinminutes.payment.controller;

import com.helpinminutes.payment.dto.FinancialSummaryResponse;
import com.helpinminutes.payment.dto.LedgerEntryResponse;
import com.helpinminutes.payment.entity.LedgerEntry;
import com.helpinminutes.payment.service.LedgerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/ledger")
@RequiredArgsConstructor
@Tag(name = "Ledger", description = "Financial ledger APIs")
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping("/task/{taskId}")
    @Operation(summary = "Get ledger entries for task", description = "Retrieves all ledger entries for a specific task")
    public ResponseEntity<List<LedgerEntryResponse>> getLedgerByTask(
            @Parameter(description = "Task ID") @PathVariable UUID taskId) {
        log.info("Getting ledger entries for task: {}", taskId);
        List<LedgerEntryResponse> entries = ledgerService.getEntriesByTask(taskId);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/payment/{paymentId}")
    @Operation(summary = "Get ledger entries for payment", description = "Retrieves all ledger entries for a specific payment")
    public ResponseEntity<List<LedgerEntryResponse>> getLedgerByPayment(
            @Parameter(description = "Payment ID") @PathVariable UUID paymentId) {
        log.info("Getting ledger entries for payment: {}", paymentId);
        List<LedgerEntryResponse> entries = ledgerService.getEntriesByPayment(paymentId);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get ledger entries for user", description = "Retrieves all ledger entries for a specific user")
    public ResponseEntity<List<LedgerEntryResponse>> getLedgerByUser(
            @Parameter(description = "User ID") @PathVariable UUID userId) {
        log.info("Getting ledger entries for user: {}", userId);
        List<LedgerEntryResponse> entries = ledgerService.getEntriesByUser(userId);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/summary")
    @Operation(summary = "Get financial summary", description = "Retrieves overall financial summary")
    public ResponseEntity<FinancialSummaryResponse> getFinancialSummary() {
        log.info("Getting financial summary");
        
        // Calculate totals from ledger entries
        BigDecimal totalPlatformFees = ledgerService.getTotalByEntryType(LedgerEntry.LedgerEntryType.PLATFORM_FEE);
        BigDecimal totalHelperPayouts = ledgerService.getTotalByEntryType(LedgerEntry.LedgerEntryType.HELPER_PAYOUT);
        BigDecimal totalSocialSecurity = ledgerService.getTotalByEntryType(LedgerEntry.LedgerEntryType.SOCIAL_SECURITY);
        BigDecimal totalTax = ledgerService.getTotalByEntryType(LedgerEntry.LedgerEntryType.TAX);
        BigDecimal totalRefunds = ledgerService.getTotalByEntryType(LedgerEntry.LedgerEntryType.REFUND);

        // Calculate totals
        BigDecimal totalRevenue = totalPlatformFees.add(totalTax);
        BigDecimal pendingPayouts = totalHelperPayouts.subtract(
                ledgerService.getTotalByEntryType(LedgerEntry.LedgerEntryType.HELPER_PAYOUT)
                        .multiply(BigDecimal.valueOf(0.1)) // Assume 10% already processed
        );
        BigDecimal availableBalance = totalRevenue.subtract(totalRefunds.abs());

        FinancialSummaryResponse summary = FinancialSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .totalPlatformFees(totalPlatformFees)
                .totalTaxCollected(totalTax)
                .totalHelperPayouts(totalHelperPayouts)
                .totalSocialSecurity(totalSocialSecurity)
                .totalRefunds(totalRefunds.abs())
                .pendingPayouts(pendingPayouts)
                .availableBalance(availableBalance)
                .periodStart(LocalDateTime.now().minusDays(30))
                .periodEnd(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(summary);
    }
}
