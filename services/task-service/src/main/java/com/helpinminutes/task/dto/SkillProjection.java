package com.helpinminutes.task.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public interface SkillProjection {
    UUID getId();
    String getName();
    String getSlug();
    String getDescription();
    String getIconUrl();
    Boolean getIsActive();
    Integer getDisplayOrder();
    Integer getEstimatedDurationMinutes();
    BigDecimal getBasePrice();
    String getPriceUnit();
    Boolean getRequiresTools();
    Boolean getRequiresMaterials();
    LocalDateTime getCreatedAt();
    LocalDateTime getUpdatedAt();
}
