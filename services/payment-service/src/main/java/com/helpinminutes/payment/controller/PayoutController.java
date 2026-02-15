package com.helpinminutes.payment.controller;

import com.helpinminutes.payment.dto.PayoutRequest;
import com.helpinminutes.payment.dto.PayoutResponse;
import com.helpinminutes.payment.service.PayoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payouts")
@RequiredArgsConstructor
@Tag(name = "Payouts", description = "Helper payout APIs")
public class PayoutController {

    private final PayoutService payoutService;

    @PostMapping
    @Operation(summary = "Create payout", description = "Creates a payout to helper's bank account")
    public ResponseEntity<PayoutResponse> createPayout(
            @Valid @RequestBody PayoutRequest request) {
        log.info("Creating payout for helper: {}, task: {}", request.getHelperId(), request.getTaskId());
        PayoutResponse response = payoutService.createPayout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{payoutId}")
    @Operation(summary = "Get payout status", description = "Retrieves payout details and status")
    public ResponseEntity<PayoutResponse> getPayout(
            @Parameter(description = "Payout ID") @PathVariable UUID payoutId) {
        log.info("Getting payout details: {}", payoutId);
        PayoutResponse response = payoutService.getPayout(payoutId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{payoutId}/retry")
    @Operation(summary = "Retry failed payout", description = "Retries a failed payout")
    public ResponseEntity<PayoutResponse> retryPayout(
            @Parameter(description = "Payout ID") @PathVariable UUID payoutId) {
        log.info("Retrying payout: {}", payoutId);
        PayoutResponse response = payoutService.retryPayout(payoutId);
        return ResponseEntity.ok(response);
    }
}
