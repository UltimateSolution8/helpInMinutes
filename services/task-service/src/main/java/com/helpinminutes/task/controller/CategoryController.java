package com.helpinminutes.task.controller;

import com.helpinminutes.task.dto.SkillResponse;
import com.helpinminutes.task.entity.Category;
import com.helpinminutes.task.entity.Skill;
import com.helpinminutes.task.mapper.SkillMapper;
import com.helpinminutes.task.repository.CategoryRepository;
import com.helpinminutes.task.repository.SkillRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Categories & Skills", description = "APIs for fetching task categories and skills")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final SkillRepository skillRepository;
    private final SkillMapper skillMapper;

    @GetMapping("/categories")
    @Operation(summary = "Get all categories", description = "Fetch list of all task categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll().stream()
                .map(category -> {
                    category.setSkills(null);
                    return category;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/categories/{id}")
    @Operation(summary = "Get category by ID", description = "Fetch category details by ID")
    public ResponseEntity<Category> getCategoryById(@PathVariable UUID id) {
        Optional<Category> category = categoryRepository.findById(id);
        return category.map(cat -> {
            cat.setSkills(null);
            return ResponseEntity.ok(cat);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/skills")
    @Operation(summary = "Get all skills", description = "Fetch list of all task skills")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SkillResponse>> getAllSkills() {
        List<Skill> skills = skillRepository.findAllWithCategories();
        List<SkillResponse> skillResponses = skillMapper.toSkillResponses(skills);
        return ResponseEntity.ok(skillResponses);
    }

    @GetMapping("/categories/{id}/skills")
    @Operation(summary = "Get skills by category", description = "Fetch skills associated with a specific category")
    public ResponseEntity<List<SkillResponse>> getSkillsByCategory(@PathVariable UUID id) {
        Optional<Category> category = categoryRepository.findByIdWithSkills(id);
        return category.map(c -> {
            List<SkillResponse> skillResponses = skillMapper.toSkillResponses(c.getSkills());
            return ResponseEntity.ok(skillResponses);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
