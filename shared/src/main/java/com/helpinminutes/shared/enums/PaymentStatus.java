package com.helpinminutes.shared.enums;

/**
 * Enum representing payment transaction states.
 * Used in payment-service for tracking payment lifecycle.
 */
public enum PaymentStatus {
    PENDING,
    CAPTURED,
    FAILED,
    REFUNDED,
    PARTIALLY_REFUNDED
}
