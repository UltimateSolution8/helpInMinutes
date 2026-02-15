package com.helpinminutes.task.repository;

import com.helpinminutes.task.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);

    List<Category> findByIsActiveTrue();

    List<Category> findByIsActiveTrueOrderByDisplayOrderAsc();

    Page<Category> findByIsActiveTrue(Pageable pageable);

    boolean existsBySlug(String slug);

    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.skills WHERE c.id = :id")
    Optional<Category> findByIdWithSkills(@Param("id") UUID id);

    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.skills WHERE c.slug = :slug")
    Optional<Category> findBySlugWithSkills(@Param("slug") String slug);

    @Query("SELECT c FROM Category c WHERE c.isActive = true ORDER BY c.displayOrder ASC")
    List<Category> findAllActiveOrdered();

    @Query("SELECT COUNT(s) FROM Category c JOIN c.skills s WHERE c.id = :categoryId")
    Long countSkillsByCategoryId(@Param("categoryId") UUID categoryId);
}
