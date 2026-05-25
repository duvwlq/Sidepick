package com.failforward.backend.domain.category.dto;

import com.failforward.backend.domain.category.CategoryMapper;
import com.failforward.backend.domain.category.entity.BusinessCategory;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String icon,
        String color,
        String slug,
        String type
) {
    public static CategoryResponse from(BusinessCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getIcon(),
                category.getColor(),
                CategoryMapper.toSlug(category.getName()).orElse(null),
                category.getType().name().toLowerCase()
        );
    }
}
