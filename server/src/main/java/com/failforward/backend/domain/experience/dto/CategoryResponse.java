package com.failforward.backend.domain.experience.dto;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String icon,
        String color
) {
}
