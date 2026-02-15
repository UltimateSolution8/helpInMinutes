package com.helpinminutes.payment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
public class TaxCalculationService {

    @Value("${app.payment.platform-fee-percentage:15}")
    private BigDecimal platformFeePercentage;

    @Value("${app.payment.min-platform-fee:5}")
    private BigDecimal minPlatformFee;

    @Value("${app.payment.max-platform-fee:100}")
    private BigDecimal maxPlatformFee;

    @Value("${app.payment.social-security-percentage:1.5}")
    private BigDecimal socialSecurityPercentage;

    @Value("${app.payment.gst-percentage:18}")
    private BigDecimal gstPercentage;

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final int SCALE = 2;

    /**
     * Calculate platform fee based on task amount
     */
    public BigDecimal calculatePlatformFee(BigDecimal taskAmount) {
        BigDecimal fee = taskAmount
                .multiply(platformFeePercentage)
                .divide(ONE_HUNDRED, SCALE, RoundingMode.HALF_UP);

        // Apply min/max constraints
        if (fee.compareTo(minPlatformFee) < 0) {
            fee = minPlatformFee;
        } else if (fee.compareTo(maxPlatformFee) > 0) {
            fee = maxPlatformFee;
        }

        log.debug("Calculated platform fee: {} for task amount: {}", fee, taskAmount);
        return fee;
    }

    /**
     * Calculate GST on platform fee
     */
    public BigDecimal calculateGst(BigDecimal platformFee) {
        BigDecimal gst = platformFee
                .multiply(gstPercentage)
                .divide(ONE_HUNDRED, SCALE, RoundingMode.HALF_UP);

        log.debug("Calculated GST: {} for platform fee: {}", gst, platformFee);
        return gst;
    }

    /**
     * Calculate social security reserve from helper earnings
     */
    public BigDecimal calculateSocialSecurity(BigDecimal helperEarnings) {
        BigDecimal socialSecurity = helperEarnings
                .multiply(socialSecurityPercentage)
                .divide(ONE_HUNDRED, SCALE, RoundingMode.HALF_UP);

        log.debug("Calculated social security: {} for helper earnings: {}", socialSecurity, helperEarnings);
        return socialSecurity;
    }

    /**
     * Calculate helper payout amount
     * Helper payout = Task price - Platform fee - Social Security
     */
    public BigDecimal calculateHelperPayout(BigDecimal taskAmount, BigDecimal platformFee, BigDecimal socialSecurity) {
        BigDecimal payout = taskAmount
                .subtract(platformFee)
                .subtract(socialSecurity);

        log.debug("Calculated helper payout: {} (task: {}, platform fee: {}, social security: {})",
                payout, taskAmount, platformFee, socialSecurity);
        return payout;
    }

    /**
     * Calculate total amount to be charged from customer
     * This includes task amount + GST on platform fee
     */
    public BigDecimal calculateTotalCharge(BigDecimal taskAmount, BigDecimal platformFee, BigDecimal gst) {
        BigDecimal total = taskAmount.add(gst);
        log.debug("Calculated total charge: {} (task: {}, GST: {})", total, taskAmount, gst);
        return total;
    }

    /**
     * Get financial breakdown for a task
     */
    public FinancialBreakdown calculateFinancialBreakdown(BigDecimal taskAmount) {
        BigDecimal platformFee = calculatePlatformFee(taskAmount);
        BigDecimal gst = calculateGst(platformFee);
        BigDecimal helperEarningsBeforeSS = taskAmount.subtract(platformFee);
        BigDecimal socialSecurity = calculateSocialSecurity(helperEarningsBeforeSS);
        BigDecimal helperPayout = calculateHelperPayout(taskAmount, platformFee, socialSecurity);
        BigDecimal totalCharge = calculateTotalCharge(taskAmount, platformFee, gst);

        return FinancialBreakdown.builder()
                .taskAmount(taskAmount)
                .platformFee(platformFee)
                .gst(gst)
                .socialSecurity(socialSecurity)
                .helperPayout(helperPayout)
                .totalCharge(totalCharge)
                .build();
    }

    /**
     * Financial breakdown data class
     */
    @lombok.Builder
    @lombok.Data
    public static class FinancialBreakdown {
        private BigDecimal taskAmount;
        private BigDecimal platformFee;
        private BigDecimal gst;
        private BigDecimal socialSecurity;
        private BigDecimal helperPayout;
        private BigDecimal totalCharge;
    }
}
