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
        String taxDisplayName = CategoryMapper.mappings().get("tax-business").replace('\uCA0C', '/');
        String digitalProductsDisplayName = CategoryMapper.mappings().get("digital-products");

        assertEquals("tax-business", CategoryMapper.toSlug(taxDisplayName).orElseThrow());
        assertEquals("digital-products", CategoryMapper.toSlug(digitalProductsDisplayName).orElseThrow());
    }

    @Test
    void returnsEmptyForUnknownValues() {
        assertTrue(CategoryMapper.toKorean("unknown").isEmpty());
        assertTrue(CategoryMapper.toSlug("unknown category").isEmpty());
    }
}
