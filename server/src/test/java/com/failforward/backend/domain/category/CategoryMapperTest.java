package com.failforward.backend.domain.category;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class CategoryMapperTest {

    @Test
    void allSixteenMappingsRoundTrip() {
        CategoryMapper.mappings().forEach((slug, korean) -> {
            assertEquals(korean, CategoryMapper.toKorean(slug).orElseThrow());
            assertEquals(slug, CategoryMapper.toSlug(korean).orElseThrow());
        });
    }

    @Test
    void normalizesSlashWhenLookingUpKoreanName() {
        assertEquals("tax-business", CategoryMapper.toSlug("세금/사업자").orElseThrow());
        assertEquals("digital-products", CategoryMapper.toSlug("디지털·지식판매").orElseThrow());
    }

    @Test
    void returnsEmptyForUnknownValues() {
        assertTrue(CategoryMapper.toKorean("unknown").isEmpty());
        assertTrue(CategoryMapper.toSlug("없는 카테고리").isEmpty());
    }
}
