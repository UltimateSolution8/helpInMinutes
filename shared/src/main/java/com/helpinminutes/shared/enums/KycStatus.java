package com.helpinminutes.shared.enums;

/**
 * Enum representing KYC (Know Your Customer) verification states.
 * Used in identity-service for helper and user verification.
 */
public enum KycStatus {
    PENDING,
    VERIFIED,
    PENDING_MANUAL,
    REJECTED
}
