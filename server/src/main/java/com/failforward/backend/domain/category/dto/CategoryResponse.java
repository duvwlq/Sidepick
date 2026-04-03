package com.failforward.backend.domain.category.dto;

import com.failforward.backend.common.support.CategoryCatalog.CategoryItem;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String icon,
        String color
) {
    public static CategoryResponse from(CategoryItem item) {
        return new CategoryResponse(item.id(), item.name(), item.description(), item.icon(), item.color());
    }
}
