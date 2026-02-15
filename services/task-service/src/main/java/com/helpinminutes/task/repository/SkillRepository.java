package com.helpinminutes.task.repository;

import com.helpinminutes.task.dto.SkillProjection;
import com.helpinminutes.task.entity.Skill;
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
public interface SkillRepository extends JpaRepository<Skill, UUID> {

    @Query("SELECT s FROM Skill s")
    List<SkillProjection> findAllProjectedBy();

    @Query("SELECT s FROM Skill s JOIN FETCH s.category")
    List<Skill> findAllWithCategories();

    Optional<Skill> findBySlug(String slug);

    List<Skill> findByCategoryId(UUID categoryId);

    List<Skill> findByCategoryIdAndIsActiveTrue(UUID categoryId);

    List<Skill> findByParentId(UUID parentId);

    List<Skill> findByParentIdAndIsActiveTrue(UUID parentId);

    List<Skill> findByIsActiveTrue();

    Page<Skill> findByIsActiveTrue(Pageable pageable);

    boolean existsBySlug(String slug);

    @Query("SELECT s FROM Skill s WHERE s.category.id = :categoryId AND s.parent IS NULL")
    List<Skill> findRootSkillsByCategoryId(@Param("categoryId") UUID categoryId);

    @Query("SELECT s FROM Skill s WHERE s.category.id = :categoryId AND s.parent IS NULL AND s.isActive = true")
    List<Skill> findActiveRootSkillsByCategoryId(@Param("categoryId") UUID categoryId);

    @Query("SELECT s FROM Skill s LEFT JOIN FETCH s.children WHERE s.id = :id")
    Optional<Skill> findByIdWithChildren(@Param("id") UUID id);

    @Query("SELECT s FROM Skill s LEFT JOIN FETCH s.parent WHERE s.id = :id")
    Optional<Skill> findByIdWithParent(@Param("id") UUID id);

    @Query("SELECT s FROM Skill s LEFT JOIN FETCH s.category WHERE s.id = :id")
    Optional<Skill> findByIdWithCategory(@Param("id") UUID id);

    @Query("SELECT s FROM Skill s WHERE s.slug IN (:slugs)")
    List<Skill> findBySlugIn(@Param("slugs") List<String> slugs);

    @Query("SELECT s FROM Skill s WHERE s.category.id = :categoryId ORDER BY s.displayOrder ASC")
    List<Skill> findByCategoryIdOrderByDisplayOrder(@Param("categoryId") UUID categoryId);

    @Query("SELECT COUNT(s) FROM Skill s WHERE s.parent.id = :parentId")
    Long countChildrenByParentId(@Param("parentId") UUID parentId);

    @Query("SELECT s FROM Skill s WHERE s.isActive = true AND s.requiresTools = true")
    List<Skill> findActiveSkillsRequiringTools();

    @Query("SELECT s FROM Skill s WHERE s.isActive = true AND s.requiresMaterials = true")
    List<Skill> findActiveSkillsRequiringMaterials();
}
