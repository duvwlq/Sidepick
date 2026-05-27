package com.failforward.backend.domain.category;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public final class CategoryMapper {

    private static final Map<String, String> SLUG_TO_KOREAN = Map.ofEntries(
            Map.entry("commerce", "온라인 판매·이커머스"),
            Map.entry("content-sns", "콘텐츠·SNS"),
            Map.entry("digital-product", "디지털·지식판매"),
            Map.entry("platform-labor", "플랫폼 노동"),
            Map.entry("talent", "재능·프리랜서"),
            Map.entry("investment", "투자·재테크"),
            Map.entry("offline", "오프라인 부업"),
            Map.entry("pre-start", "부업 시작 전 공통"),
            Map.entry("tax", "세금·사업자"),
            Map.entry("work-balance", "본업 + 부업"),
            Map.entry("marketing", "마케팅·광고 운영"),
            Map.entry("tools", "도구·툴 추천"),
            Map.entry("mental", "멘탈 관리·번아웃"),
            Map.entry("legal", "법률·계약"),
            Map.entry("accounting", "회계·장부"),
            Map.entry("insight", "부업 인사이트")
    );

    private static final Map<String, String> KOREAN_TO_SLUG = createReverseMap();

    private CategoryMapper() {
    }

    public static Optional<String> toKorean(String slug) {
        if (slug == null || slug.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(SLUG_TO_KOREAN.get(slug.trim().toLowerCase(Locale.ROOT)));
    }

    public static Optional<String> toSlug(String korean) {
        if (korean == null || korean.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(KOREAN_TO_SLUG.get(normalizeDisplayName(korean)));
    }

    public static Map<String, String> mappings() {
        return SLUG_TO_KOREAN;
    }

    private static Map<String, String> createReverseMap() {
        Map<String, String> reverse = new LinkedHashMap<>();
        SLUG_TO_KOREAN.forEach((slug, korean) -> reverse.put(normalizeDisplayName(korean), slug));
        return Map.copyOf(reverse);
    }

    private static String normalizeDisplayName(String value) {
        return value.trim()
                .replace('/', '·')
                .replaceAll("\\s+", " ");
    }
}
