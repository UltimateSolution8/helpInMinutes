package com.helpinminutes.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private UUID categoryId;
    private String categoryName;
    private String iconUrl;
    private Boolean isActive;
    private Integer displayOrder;
    private Integer estimatedDurationMinutes;
    private BigDecimal basePrice;
    private String priceUnit;
    private Boolean requiresTools;
    private Boolean requiresMaterials;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}