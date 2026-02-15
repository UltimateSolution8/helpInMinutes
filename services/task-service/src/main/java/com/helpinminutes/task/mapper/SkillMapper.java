package com.helpinminutes.task.mapper;

import com.helpinminutes.task.dto.SkillResponse;
import com.helpinminutes.task.entity.Skill;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class SkillMapper {

    public SkillResponse toSkillResponse(Skill skill) {
        if (skill == null) {
            return null;
        }

        SkillResponse.SkillResponseBuilder builder = SkillResponse.builder()
                .id(skill.getId())
                .name(skill.getName())
                .slug(skill.getSlug())
                .description(skill.getDescription())
                .iconUrl(skill.getIconUrl())
                .isActive(skill.getIsActive())
                .displayOrder(skill.getDisplayOrder())
                .estimatedDurationMinutes(skill.getEstimatedDurationMinutes())
                .basePrice(skill.getBasePrice())
                .priceUnit(skill.getPriceUnit())
                .requiresTools(skill.getRequiresTools())
                .requiresMaterials(skill.getRequiresMaterials())
                .createdAt(skill.getCreatedAt())
                .updatedAt(skill.getUpdatedAt());

        // Handle category (without initializing lazy-loaded properties)
        if (skill.getCategory() != null) {
            builder.categoryId(skill.getCategory().getId());
            builder.categoryName(skill.getCategory().getName());
        }

        return builder.build();
    }

    public List<SkillResponse> toSkillResponses(List<Skill> skills) {
        if (skills == null) {
            return null;
        }

        return skills.stream()
                .map(this::toSkillResponse)
                .collect(Collectors.toList());
    }
}
