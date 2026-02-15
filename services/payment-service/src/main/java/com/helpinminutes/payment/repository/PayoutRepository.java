package com.helpinminutes.payment.repository;

import com.helpinminutes.payment.entity.Payout;
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
public interface PayoutRepository extends JpaRepository<Payout, UUID> {

    List<Payout> findByHelperId(UUID helperId);

    Page<Payout> findByHelperId(UUID helperId, Pageable pageable);

    List<Payout> findByTaskId(UUID taskId);

    List<Payout> findByPaymentId(UUID paymentId);

    Optional<Payout> findByProviderPayoutId(String providerPayoutId);

    boolean existsByPaymentId(UUID paymentId);

    List<Payout> findByStatus(Payout.PayoutStatus status);

    Page<Payout> findByStatus(Payout.PayoutStatus status, Pageable pageable);

    @Query("SELECT p FROM Payout p WHERE p.helperId = :helperId AND p.status = :status")
    List<Payout> findByHelperIdAndStatus(@Param("helperId") UUID helperId,
                                         @Param("status") Payout.PayoutStatus status);

    @Query("SELECT p FROM Payout p WHERE p.status = :status AND p.nextRetryAt < :now")
    List<Payout> findRetryablePayouts(@Param("status") Payout.PayoutStatus status,
                                      @Param("now") LocalDateTime now);

    @Query("SELECT p FROM Payout p WHERE p.status = 'PENDING' AND p.createdAt < :cutoffTime")
    List<Payout> findStalePayouts(@Param("cutoffTime") LocalDateTime cutoffTime);

    @Modifying
    @Query("UPDATE Payout p SET p.status = :newStatus, p.processedAt = :processedAt, " +
           "p.providerPayoutId = :providerPayoutId, p.utrNumber = :utrNumber " +
           "WHERE p.id = :payoutId")
    int markAsCompleted(@Param("payoutId") UUID payoutId,
                        @Param("newStatus") Payout.PayoutStatus newStatus,
                        @Param("processedAt") LocalDateTime processedAt,
                        @Param("providerPayoutId") String providerPayoutId,
                        @Param("utrNumber") String utrNumber);

    @Modifying
    @Query("UPDATE Payout p SET p.status = :newStatus, p.failureReason = :failureReason, " +
           "p.retryCount = p.retryCount + 1, p.nextRetryAt = :nextRetryAt " +
           "WHERE p.id = :payoutId")
    int markAsFailedWithRetry(@Param("payoutId") UUID payoutId,
                              @Param("newStatus") Payout.PayoutStatus newStatus,
                              @Param("failureReason") String failureReason,
                              @Param("nextRetryAt") LocalDateTime nextRetryAt);

    @Modifying
    @Query("UPDATE Payout p SET p.status = 'CANCELLED' WHERE p.id = :payoutId")
    int cancelPayout(@Param("payoutId") UUID payoutId);

    @Query("SELECT SUM(p.amount) FROM Payout p WHERE p.helperId = :helperId AND p.status = 'COMPLETED'")
    java.math.BigDecimal sumCompletedAmountByHelperId(@Param("helperId") UUID helperId);

    @Query("SELECT SUM(p.amount) FROM Payout p WHERE p.status = 'COMPLETED' " +
           "AND p.settledAt BETWEEN :startTime AND :endTime")
    java.math.BigDecimal sumCompletedAmountByTimeRange(@Param("startTime") LocalDateTime startTime,
                                                       @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(p) FROM Payout p WHERE p.helperId = :helperId AND p.status = :status")
    Long countByHelperIdAndStatus(@Param("helperId") UUID helperId,
                                  @Param("status") Payout.PayoutStatus status);

    @Query("SELECT COUNT(p) FROM Payout p WHERE p.status = :status")
    Long countByStatus(@Param("status") Payout.PayoutStatus status);

    @Query("SELECT p FROM Payout p WHERE p.status = 'PROCESSING' AND p.createdAt < :cutoffTime")
    List<Payout> findStuckProcessingPayouts(@Param("cutoffTime") LocalDateTime cutoffTime);
}
