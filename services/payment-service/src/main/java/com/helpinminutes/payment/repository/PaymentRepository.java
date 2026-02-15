package com.helpinminutes.payment.repository;

import com.helpinminutes.payment.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByOrderId(String orderId);

    Optional<Payment> findByProviderPaymentId(String providerPaymentId);

    List<Payment> findByTaskId(UUID taskId);

    List<Payment> findByBuyerId(UUID buyerId);

    Page<Payment> findByBuyerId(UUID buyerId, Pageable pageable);

    List<Payment> findByHelperId(UUID helperId);

    Page<Payment> findByHelperId(UUID helperId, Pageable pageable);

    List<Payment> findByStatus(Payment.PaymentStatus status);

    Page<Payment> findByStatus(Payment.PaymentStatus status, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.buyerId = :buyerId AND p.status = :status")
    List<Payment> findByBuyerIdAndStatus(@Param("buyerId") UUID buyerId, 
                                         @Param("status") Payment.PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE p.helperId = :helperId AND p.status = :status")
    List<Payment> findByHelperIdAndStatus(@Param("helperId") UUID helperId, 
                                          @Param("status") Payment.PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE p.status = :status AND p.createdAt < :cutoffTime")
    List<Payment> findStalePayments(@Param("status") Payment.PaymentStatus status, 
                                    @Param("cutoffTime") LocalDateTime cutoffTime);

    @Modifying
    @Query("UPDATE Payment p SET p.status = :newStatus, p.capturedAt = :capturedAt " +
           "WHERE p.id = :paymentId")
    int markAsCaptured(@Param("paymentId") UUID paymentId, 
                       @Param("newStatus") Payment.PaymentStatus newStatus,
                       @Param("capturedAt") LocalDateTime capturedAt);

    @Modifying
    @Query("UPDATE Payment p SET p.status = :newStatus, p.failedAt = :failedAt, " +
           "p.failureReason = :failureReason WHERE p.id = :paymentId")
    int markAsFailed(@Param("paymentId") UUID paymentId,
                     @Param("newStatus") Payment.PaymentStatus newStatus,
                     @Param("failedAt") LocalDateTime failedAt,
                     @Param("failureReason") String failureReason);

    @Modifying
    @Query("UPDATE Payment p SET p.status = :newStatus, p.refundedAt = :refundedAt, " +
           "p.refundAmount = :refundAmount, p.refundReason = :refundReason " +
           "WHERE p.id = :paymentId")
    int markAsRefunded(@Param("paymentId") UUID paymentId,
                       @Param("newStatus") Payment.PaymentStatus newStatus,
                       @Param("refundedAt") LocalDateTime refundedAt,
                       @Param("refundAmount") java.math.BigDecimal refundAmount,
                       @Param("refundReason") String refundReason);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'CAPTURED' " +
           "AND p.createdAt BETWEEN :startTime AND :endTime")
    java.math.BigDecimal sumCapturedAmountByTimeRange(@Param("startTime") LocalDateTime startTime,
                                                      @Param("endTime") LocalDateTime endTime);

    @Query("SELECT SUM(p.platformFee) FROM Payment p WHERE p.status = 'CAPTURED' " +
           "AND p.createdAt BETWEEN :startTime AND :endTime")
    java.math.BigDecimal sumPlatformFeesByTimeRange(@Param("startTime") LocalDateTime startTime,
                                                    @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status")
    Long countByStatus(@Param("status") Payment.PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE p.taskId = :taskId AND p.status = 'CAPTURED'")
    Optional<Payment> findCapturedPaymentByTaskId(@Param("taskId") UUID taskId);
}
