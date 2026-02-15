package com.helpinminutes.task.repository;

import com.helpinminutes.task.entity.Task;
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
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByBuyerId(UUID buyerId);

    Page<Task> findByBuyerId(UUID buyerId, Pageable pageable);

    List<Task> findByHelperId(UUID helperId);

    Page<Task> findByHelperId(UUID helperId, Pageable pageable);

    List<Task> findByStatus(Task.TaskStatus status);

    Page<Task> findByStatus(Task.TaskStatus status, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.buyerId = :buyerId AND t.status = :status")
    List<Task> findByBuyerIdAndStatus(@Param("buyerId") UUID buyerId, @Param("status") Task.TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.helperId = :helperId AND t.status = :status")
    List<Task> findByHelperIdAndStatus(@Param("helperId") UUID helperId, @Param("status") Task.TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.h3Index = :h3Index AND t.status = :status")
    List<Task> findByH3IndexAndStatus(@Param("h3Index") String h3Index, @Param("status") Task.TaskStatus status);

    @Query(value = "SELECT t.* FROM tasks t " +
           "WHERE t.h3_index IN (:h3Indexes) AND t.status = :status", nativeQuery = true)
    List<Task> findByH3IndexesAndStatus(@Param("h3Indexes") List<String> h3Indexes, 
                                        @Param("status") String status);

    @Query("SELECT t FROM Task t WHERE t.status = :status " +
           "AND t.createdAt < :cutoffTime")
    List<Task> findStaleTasks(@Param("status") Task.TaskStatus status, 
                              @Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT t FROM Task t WHERE t.status IN (:statuses)")
    List<Task> findByStatusIn(@Param("statuses") List<Task.TaskStatus> statuses);

    @Query("SELECT t FROM Task t WHERE t.buyerId = :userId OR t.helperId = :userId")
    List<Task> findByBuyerIdOrHelperId(@Param("userId") UUID userId);

    Page<Task> findByBuyerIdOrHelperId(UUID buyerId, UUID helperId, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.subSkill = :subSkill AND t.status = :status")
    List<Task> findBySubSkillAndStatus(@Param("subSkill") String subSkill, 
                                       @Param("status") Task.TaskStatus status);

    @Modifying
    @Query("UPDATE Task t SET t.status = :newStatus, t.updatedAt = :updatedAt " +
           "WHERE t.id = :taskId")
    int updateStatus(@Param("taskId") UUID taskId, 
                     @Param("newStatus") Task.TaskStatus newStatus,
                     @Param("updatedAt") LocalDateTime updatedAt);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.buyerId = :buyerId AND t.status = :status")
    Long countByBuyerIdAndStatus(@Param("buyerId") UUID buyerId, @Param("status") Task.TaskStatus status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.helperId = :helperId AND t.status = :status")
    Long countByHelperIdAndStatus(@Param("helperId") UUID helperId, @Param("status") Task.TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.status = :status AND t.scheduledAt < :now")
    List<Task> findOverdueTasks(@Param("status") Task.TaskStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.history WHERE t.id = :taskId")
    Optional<Task> findByIdWithHistory(@Param("taskId") UUID taskId);
}
