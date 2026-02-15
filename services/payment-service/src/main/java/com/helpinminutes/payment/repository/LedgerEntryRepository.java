package com.helpinminutes.payment.repository;

import com.helpinminutes.payment.entity.LedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {

    List<LedgerEntry> findByPaymentId(UUID paymentId);

    List<LedgerEntry> findByTaskId(UUID taskId);

    List<LedgerEntry> findByUserId(UUID userId);

    Page<LedgerEntry> findByUserId(UUID userId, Pageable pageable);

    List<LedgerEntry> findByEntryType(LedgerEntry.LedgerEntryType entryType);

    @Query("SELECT le FROM LedgerEntry le WHERE le.payment.id = :paymentId AND le.entryType = :entryType")
    Optional<LedgerEntry> findByPaymentIdAndEntryType(@Param("paymentId") UUID paymentId,
                                                      @Param("entryType") LedgerEntry.LedgerEntryType entryType);

    @Query("SELECT le FROM LedgerEntry le WHERE le.userId = :userId AND le.entryType = :entryType")
    List<LedgerEntry> findByUserIdAndEntryType(@Param("userId") UUID userId,
                                               @Param("entryType") LedgerEntry.LedgerEntryType entryType);

    @Query("SELECT le FROM LedgerEntry le WHERE le.createdAt BETWEEN :startTime AND :endTime")
    List<LedgerEntry> findByTimeRange(@Param("startTime") LocalDateTime startTime,
                                      @Param("endTime") LocalDateTime endTime);

    @Query("SELECT le FROM LedgerEntry le WHERE le.entryType = :entryType " +
           "AND le.createdAt BETWEEN :startTime AND :endTime")
    List<LedgerEntry> findByEntryTypeAndTimeRange(@Param("entryType") LedgerEntry.LedgerEntryType entryType,
                                                  @Param("startTime") LocalDateTime startTime,
                                                  @Param("endTime") LocalDateTime endTime);

    @Query("SELECT SUM(le.amount) FROM LedgerEntry le WHERE le.entryType = :entryType " +
           "AND le.isReversed = false")
    BigDecimal sumByEntryType(@Param("entryType") LedgerEntry.LedgerEntryType entryType);

    @Query("SELECT COALESCE(SUM(le.amount), 0) FROM LedgerEntry le WHERE le.entryType = :entryType " +
           "AND le.isReversed = false")
    BigDecimal sumAmountByEntryType(@Param("entryType") LedgerEntry.LedgerEntryType entryType);

    @Query("SELECT SUM(le.amount) FROM LedgerEntry le WHERE le.entryType = :entryType " +
           "AND le.isReversed = false AND le.createdAt BETWEEN :startTime AND :endTime")
    BigDecimal sumByEntryTypeAndTimeRange(@Param("entryType") LedgerEntry.LedgerEntryType entryType,
                                          @Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);

    @Query("SELECT SUM(le.amount) FROM LedgerEntry le WHERE le.userId = :userId " +
           "AND le.entryType = :entryType AND le.isReversed = false")
    BigDecimal sumByUserIdAndEntryType(@Param("userId") UUID userId,
                                       @Param("entryType") LedgerEntry.LedgerEntryType entryType);

    @Query("SELECT le FROM LedgerEntry le WHERE le.isReversed = false " +
           "AND le.entryType = 'HELPER_PAYOUT' AND le.userId = :helperId")
    List<LedgerEntry> findPendingPayoutsByHelperId(@Param("helperId") UUID helperId);

    @Query("SELECT COUNT(le) FROM LedgerEntry le WHERE le.entryType = :entryType AND le.isReversed = false")
    Long countByEntryType(@Param("entryType") LedgerEntry.LedgerEntryType entryType);

    @Query("SELECT le FROM LedgerEntry le JOIN FETCH le.payment WHERE le.id = :id")
    Optional<LedgerEntry> findByIdWithPayment(@Param("id") UUID id);
}
