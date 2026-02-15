package com.helpinminutes.payment.controller;

import com.helpinminutes.payment.dto.*;
import com.helpinminutes.payment.service.CashPaymentService;
import com.helpinminutes.payment.service.PaymentService;
import com.helpinminutes.payment.service.RefundService;
import com.helpinminutes.payment.service.TaxCalculationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing APIs")
public class PaymentController {

    private final PaymentService paymentService;
    private final CashPaymentService cashPaymentService;
    private final RefundService refundService;
    private final TaxCalculationService taxCalculationService;

    @PostMapping("/order")
    @Operation(summary = "Create a new payment order", description = "Creates a Razorpay order for payment")
    public ResponseEntity<CreateOrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        log.info("Creating payment order for task: {}", request.getTaskId());
        CreateOrderResponse response = paymentService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/capture")
    @Operation(summary = "Capture payment", description = "Captures payment after successful Razorpay payment")
    public ResponseEntity<PaymentResponse> capturePayment(
            @Valid @RequestBody PaymentCaptureRequest request) {
        log.info("Capturing payment: {}", request.getPaymentId());
        PaymentResponse response = paymentService.capturePayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cash")
    @Operation(summary = "Initiate cash payment", description = "Creates a cash payment and generates OTP")
    public ResponseEntity<PaymentResponse> initiateCashPayment(
            @Valid @RequestBody CashPaymentRequest request) {
        log.info("Initiating cash payment for task: {}", request.getTaskId());
        PaymentResponse response = cashPaymentService.initiateCashPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/cash/verify")
    @Operation(summary = "Verify cash payment OTP", description = "Verifies OTP for cash payment")
    public ResponseEntity<PaymentResponse> verifyCashPayment(
            @Valid @RequestBody CashPaymentVerifyRequest request) {
        log.info("Verifying cash payment: {}", request.getPaymentId());
        PaymentResponse response = cashPaymentService.verifyCashPayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cash/{paymentId}/resend-otp")
    @Operation(summary = "Resend cash payment OTP", description = "Resends OTP for cash payment verification")
    public ResponseEntity<Void> resendCashOtp(
            @Parameter(description = "Payment ID") @PathVariable UUID paymentId) {
        log.info("Resending OTP for cash payment: {}", paymentId);
        cashPaymentService.resendOtp(paymentId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment details", description = "Retrieves payment details by ID")
    public ResponseEntity<PaymentResponse> getPayment(
            @Parameter(description = "Payment ID") @PathVariable UUID paymentId) {
        log.info("Getting payment details: {}", paymentId);
        PaymentResponse response = paymentService.getPayment(paymentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get payment by order ID", description = "Retrieves payment details by order ID")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(
            @Parameter(description = "Order ID") @PathVariable String orderId) {
        log.info("Getting payment by order ID: {}", orderId);
        PaymentResponse response = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{paymentId}/refund")
    @Operation(summary = "Process refund", description = "Processes refund for a payment")
    public ResponseEntity<RefundResponse> processRefund(
            @Parameter(description = "Payment ID") @PathVariable UUID paymentId,
            @Valid @RequestBody RefundRequest request) {
        log.info("Processing refund for payment: {}", paymentId);
        // Ensure paymentId in path matches request
        request.setPaymentId(paymentId);
        RefundResponse response = refundService.processRefundWithChecks(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{paymentId}/refund")
    @Operation(summary = "Get refund status", description = "Retrieves refund status for a payment")
    public ResponseEntity<RefundResponse> getRefundStatus(
            @Parameter(description = "Payment ID") @PathVariable UUID paymentId) {
        log.info("Getting refund status for payment: {}", paymentId);
        RefundResponse response = refundService.getRefundStatus(paymentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/calculate-breakdown")
    @Operation(summary = "Calculate financial breakdown", description = "Calculates platform fee, GST, social security for a given amount")
    public ResponseEntity<TaxCalculationService.FinancialBreakdown> calculateBreakdown(
            @RequestParam BigDecimal amount) {
        log.info("Calculating financial breakdown for amount: {}", amount);
        TaxCalculationService.FinancialBreakdown breakdown = taxCalculationService.calculateFinancialBreakdown(amount);
        return ResponseEntity.ok(breakdown);
    }
}
