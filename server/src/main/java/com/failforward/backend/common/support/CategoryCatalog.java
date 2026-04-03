package com.failforward.backend.common.support;

import java.util.List;

public final class CategoryCatalog {

    private static final List<CategoryItem> ITEMS = List.of(
            new CategoryItem(1L, "온라인사업", "쇼핑몰, 블로그, 유튜브 등 온라인 기반 부업", "💻", "#3B82F6"),
            new CategoryItem(2L, "오프라인사업", "매장 운영, 로컬 서비스, 오프라인 판매 중심 부업", "🏪", "#10B981"),
            new CategoryItem(3L, "콘텐츠", "전자책, 강의, 뉴스레터, 크리에이터형 부업", "🎨", "#F59E0B"),
            new CategoryItem(4L, "투자형", "스마트스토어 자동화, 재고형 사업, 소규모 투자 시도", "📈", "#EF4444"),
            new CategoryItem(5L, "기타", "명확히 분류되지 않는 기타 부업", "🧩", "#8B5CF6")
    );

    private CategoryCatalog() {
    }

    public static List<CategoryItem> getItems() {
        return ITEMS;
    }

    public static CategoryItem getById(Long id) {
        return ITEMS.stream()
                .filter(item -> item.id().equals(id))
                .findFirst()
                .orElse(ITEMS.get(ITEMS.size() - 1));
    }

    public record CategoryItem(Long id, String name, String description, String icon, String color) {
    }
}
