package com.helpinminutes.shared.enums;

/**
 * Enum representing task lifecycle states.
 * Used across task-service, matching-service, and payment-service.
 */
public enum TaskStatus {
    CREATED,
    MATCHING,
    DISPATCHED,
    ACCEPTED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
