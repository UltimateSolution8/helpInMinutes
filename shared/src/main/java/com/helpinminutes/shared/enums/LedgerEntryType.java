package com.helpinminutes.shared.enums;

/**
 * Enum representing types of ledger entries for financial tracking.
 * Used in payment-service for accounting and financial reporting.
 */
public enum LedgerEntryType {
    PLATFORM_FEE,
    HELPER_PAYOUT,
    SOCIAL_SECURITY,
    TAX,
    REFUND,
    ADJUSTMENT,
    PENALTY
}
