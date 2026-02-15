package com.helpinminutes.task.repository;

import com.helpinminutes.task.entity.Dispute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    Optional<Dispute> findByTaskId(UUID taskId);

    List<Dispute> findByStatus(Dispute.DisputeStatus status);

    Page<Dispute> findByStatus(Dispute.DisputeStatus status, Pageable pageable);

    List<Dispute> findByCreatedBy(UUID createdBy);

    List<Dispute> findByReason(Dispute.DisputeReason reason);

    @Query("SELECT d FROM Dispute d WHERE d.status = :status AND d.createdAt < :cutoffTime")
    List<Dispute> findStaleDisputes(@Param("status") Dispute.DisputeStatus status, 
                                    @Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT d FROM Dispute d WHERE d.resolvedBy = :resolvedBy")
    List<Dispute> findByResolvedBy(@Param("resolvedBy") UUID resolvedBy);

    @Query("SELECT d FROM Dispute d WHERE d.createdAt BETWEEN :startTime AND :endTime")
    List<Dispute> findByTimeRange(@Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(d) FROM Dispute d WHERE d.status = :status")
    Long countByStatus(@Param("status") Dispute.DisputeStatus status);

    @Query("SELECT d FROM Dispute d JOIN FETCH d.task WHERE d.id = :id")
    Optional<Dispute> findByIdWithTask(@Param("id") UUID id);

    @Query("SELECT d FROM Dispute d WHERE d.resolution = :resolution")
    List<Dispute> findByResolution(@Param("resolution") Dispute.Resolution resolution);

    @Query("SELECT SUM(d.refundAmount) FROM Dispute d WHERE d.status = 'RESOLVED' " +
           "AND d.resolution = 'BUYER_FAVORED'")
    Double sumRefundAmounts();
}
