package com.helpinminutes.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryResponse {

    private BigDecimal totalRevenue;
    private BigDecimal totalPlatformFees;
    private BigDecimal totalTaxCollected;
    private BigDecimal totalHelperPayouts;
    private BigDecimal totalSocialSecurity;
    private BigDecimal totalRefunds;
    private BigDecimal pendingPayouts;
    private BigDecimal availableBalance;
    private Integer totalTransactions;
    private Integer successfulTransactions;
    private Integer failedTransactions;
    private Integer refundedTransactions;
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
}
