package com.failforward.backend.domain.category.dto;

import com.failforward.backend.domain.category.entity.BusinessCategory;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String icon,
        String color
) {
    public static CategoryResponse from(BusinessCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getIcon(),
                category.getColor()
        );
    }
}
