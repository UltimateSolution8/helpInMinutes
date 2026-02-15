package com.helpinminutes.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerEntryResponse {

    private UUID id;
    private UUID paymentId;
    private UUID taskId;
    private UUID userId;
    private String entryType;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String referenceId;
    private String referenceType;
    private Boolean isReversed;
    private LocalDateTime reversedAt;
    private String reversalReason;
    private LocalDateTime createdAt;
}
