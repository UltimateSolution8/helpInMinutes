package com.helpinminutes.identity.repository;

import com.helpinminutes.identity.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByUserId(UUID userId);

    Page<AuditLog> findByUserId(UUID userId, Pageable pageable);

    List<AuditLog> findByAction(String action);

    List<AuditLog> findByEntityTypeAndEntityId(String entityType, UUID entityId);

    @Query("SELECT al FROM AuditLog al WHERE al.user.id = :userId AND al.action = :action")
    List<AuditLog> findByUserIdAndAction(@Param("userId") UUID userId, @Param("action") String action);

    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN :startTime AND :endTime")
    List<AuditLog> findByTimeRange(@Param("startTime") LocalDateTime startTime,
                                   @Param("endTime") LocalDateTime endTime);

    @Query("SELECT al FROM AuditLog al WHERE al.user.id = :userId " +
           "AND al.createdAt BETWEEN :startTime AND :endTime")
    List<AuditLog> findByUserIdAndTimeRange(@Param("userId") UUID userId,
                                            @Param("startTime") LocalDateTime startTime,
                                            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT al FROM AuditLog al WHERE al.ipAddress = :ipAddress " +
           "AND al.createdAt BETWEEN :startTime AND :endTime")
    List<AuditLog> findByIpAddressAndTimeRange(@Param("ipAddress") String ipAddress,
                                               @Param("startTime") LocalDateTime startTime,
                                               @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(al) FROM AuditLog al WHERE al.user.id = :userId AND al.action = :action " +
           "AND al.createdAt BETWEEN :startTime AND :endTime")
    Long countByUserIdAndActionAndTimeRange(@Param("userId") UUID userId,
                                            @Param("action") String action,
                                            @Param("startTime") LocalDateTime startTime,
                                            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT al FROM AuditLog al WHERE al.entityType = :entityType " +
           "ORDER BY al.createdAt DESC")
    List<AuditLog> findByEntityTypeOrderByCreatedAtDesc(@Param("entityType") String entityType);

    @Query("SELECT al FROM AuditLog al WHERE al.requestId = :requestId")
    List<AuditLog> findByRequestId(@Param("requestId") String requestId);
}
