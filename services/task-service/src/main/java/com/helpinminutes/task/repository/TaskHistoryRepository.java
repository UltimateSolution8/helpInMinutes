package com.helpinminutes.task.repository;

import com.helpinminutes.task.entity.Task;
import com.helpinminutes.task.entity.TaskHistory;
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
public interface TaskHistoryRepository extends JpaRepository<TaskHistory, UUID> {

    List<TaskHistory> findByTaskId(UUID taskId);

    Page<TaskHistory> findByTaskId(UUID taskId, Pageable pageable);

    List<TaskHistory> findByTaskIdOrderByCreatedAtAsc(UUID taskId);

    List<TaskHistory> findByTaskIdOrderByCreatedAtDesc(UUID taskId);

    @Query("SELECT th FROM TaskHistory th WHERE th.task.id = :taskId AND th.status = :status")
    List<TaskHistory> findByTaskIdAndStatus(@Param("taskId") UUID taskId, @Param("status") Task.TaskStatus status);

    @Query("SELECT th FROM TaskHistory th WHERE th.changedBy = :userId")
    List<TaskHistory> findByChangedBy(@Param("userId") UUID userId);

    @Query("SELECT th FROM TaskHistory th WHERE th.task.id = :taskId AND th.changedBy = :userId")
    List<TaskHistory> findByTaskIdAndChangedBy(@Param("taskId") UUID taskId, @Param("userId") UUID userId);

    @Query("SELECT th FROM TaskHistory th WHERE th.createdAt BETWEEN :startTime AND :endTime")
    List<TaskHistory> findByTimeRange(@Param("startTime") LocalDateTime startTime,
                                      @Param("endTime") LocalDateTime endTime);

    @Query("SELECT th FROM TaskHistory th WHERE th.task.id = :taskId " +
           "AND th.createdAt BETWEEN :startTime AND :endTime")
    List<TaskHistory> findByTaskIdAndTimeRange(@Param("taskId") UUID taskId,
                                               @Param("startTime") LocalDateTime startTime,
                                               @Param("endTime") LocalDateTime endTime);

    @Query("SELECT th FROM TaskHistory th WHERE th.status IN (:statuses)")
    List<TaskHistory> findByStatusIn(@Param("statuses") List<Task.TaskStatus> statuses);

    @Query("SELECT COUNT(th) FROM TaskHistory th WHERE th.task.id = :taskId")
    Long countByTaskId(@Param("taskId") UUID taskId);

    @Query("SELECT th FROM TaskHistory th JOIN FETCH th.task WHERE th.task.id = :taskId")
    List<TaskHistory> findByTaskIdWithTask(@Param("taskId") UUID taskId);
}
