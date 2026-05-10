package com.failforward.backend.domain.analysis.service;

import com.failforward.backend.common.api.AiServerException;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
class DemoScenarioSupport {

    private static final DemoScenario onlineSalesScenario = new DemoScenario(
            "scenario1",
            "online_sales__revenue_structure",
            List.of(18L, 19L, 100L),
            List.of(86, 79, 73),
            List.of("수수료 구조 이해 부족", "원가 마진 측정 미흡", "공급처 확보 실패"),
            "수익 구조 이해",
            "MEDIUM",
            List.of("수수료 구조 이해 부족", "원가 마진 측정 미흡", "공급처 확보 실패"),
            "스마트스토어 6개월 운영, 매출은 매달 100만원 발생했으나 수수료·원가 구조 이해 부족으로 실질 수익은 매출의 30% 수준.",
            List.of(
                    "1단계: 첫 달은 '1개 팔면 내 손에 얼마 남나' 계산 연습을 하세요. 판매가·원가·수수료·배송비를 표로 분리해 실제 정산을 3~5회 시뮬레이션해보세요.",
                    "2단계: 같은 상품으로 스마트스토어와 쿠팡 수수료율, 정산 주기, 배송비 구조를 비교해 어느 플랫폼이 더 마진을 보장하는지 결정하세요.",
                    "3단계: 첫 3개월은 대박보다 소량 테스트에 집중하고, 수익률 5~10%가 안정적으로 나오는 품목을 찾은 뒤 그때 규모를 확장하세요."
            ),
            BigDecimal.valueOf(0.6d)
    );

    private static final DemoScenario platformWorkScenario = new DemoScenario(
            "scenario2",
            "platform_work__competition",
            List.of(7L, 10L, 12L),
            List.of(88, 84, 72),
            List.of("라이더 과다 진입", "건당 단가 하락", "본업 피로 누적"),
            "경쟁 심화",
            "MEDIUM",
            List.of("라이더 과다 진입", "건당 단가 하락", "본업 피로 누적"),
            "배달대행 플랫폼 6개월 운영, 라이더 진입 증가에 따른 건당 단가 하락과 본업 피로 누적으로 실질 시간당 수익이 5,000원 미만으로 떨어짐.",
            List.of(
                    "1단계: 시간대별로 2주 정도 기록을 남겨 주문이 몰리는 시간과 비는 시간을 파악하고, 주 단위로 평균 콜 수와 단가를 추적하세요.",
                    "2단계: 한 플랫폼만 고집하지 말고 2~3개를 병행하거나 배달과 대리운전처럼 시간대가 다른 일을 섞어 수익원을 분산하세요.",
                    "3단계: 경쟁이 덜한 지역과 골목 상권을 테스트하면서 본인 체력과 생활 리듬에 맞는 운영 구간을 찾고, 기준 수익 이하로 떨어지면 즉시 중단하세요."
            ),
            BigDecimal.valueOf(0.6d)
    );

    private final ObjectMapper objectMapper;

    DemoScenarioSupport(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    Optional<DemoScenario> match(FailureExperience experience) {
        String content = normalize(experience.getContent());
        List<String> difficulties = normalizeList(ExperienceDtos.parseStringList(experience.getDifficulties()));
        Long categoryId = experience.getCategory().getId();
        String categoryName = normalize(experience.getCategory().getName());

        if (isOnlineSalesScenario(categoryId, categoryName, content, difficulties)) {
            return Optional.of(onlineSalesScenario);
        }
        if (isPlatformWorkScenario(categoryId, categoryName, content, difficulties)) {
            return Optional.of(platformWorkScenario);
        }
        return Optional.empty();
    }

    String mergeStructuredData(FailureExperience experience, DemoScenario scenario) {
        Map<String, Object> structuredData = new LinkedHashMap<>(ExperienceDtos.parseObject(experience.getStructuredData()));
        structuredData.put("demoScenario", scenario.code());
        structuredData.put("demoSuccessGuideKey", scenario.successGuideKey());
        structuredData.put("demoSimilarCaseIds", scenario.similarCaseIds());
        try {
            return objectMapper.writeValueAsString(structuredData);
        } catch (Exception exception) {
            throw new AiServerException("Failed to serialize demo scenario metadata.", exception);
        }
    }

    private boolean isOnlineSalesScenario(
            Long categoryId,
            String categoryName,
            String content,
            List<String> difficulties
    ) {
        boolean categoryMatches = Long.valueOf(1L).equals(categoryId) || categoryName.contains("온라인");
        boolean contentMatches = keywordCount(content, List.of("스마트스토어", "수수료", "배송비", "도매", "정산", "실수익")) >= 2;
        boolean difficultyMatches = containsAny(difficulties, List.of("수익 구조 이해", "경쟁 심화"));
        return categoryMatches && contentMatches && difficultyMatches;
    }

    private boolean isPlatformWorkScenario(
            Long categoryId,
            String categoryName,
            String content,
            List<String> difficulties
    ) {
        boolean categoryMatches = Long.valueOf(4L).equals(categoryId) || categoryName.contains("플랫폼");
        boolean contentMatches = keywordCount(content, List.of("배달대행", "라이더", "단가", "콜", "기름값", "시간당")) >= 2;
        boolean difficultyMatches = containsAny(difficulties, List.of("경쟁 심화", "시간 관리", "수익화 연결"));
        return categoryMatches && contentMatches && difficultyMatches;
    }

    private int keywordCount(String content, List<String> keywords) {
        return (int) keywords.stream()
                .filter(content::contains)
                .count();
    }

    private boolean containsAny(List<String> values, List<String> expected) {
        return values.stream()
                .anyMatch(value -> expected.stream().anyMatch(value::contains));
    }

    private List<String> normalizeList(List<String> values) {
        return values.stream()
                .map(this::normalize)
                .toList();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    record DemoScenario(
            String code,
            String successGuideKey,
            List<Long> similarCaseIds,
            List<Integer> matchRates,
            List<String> keywords,
            String failureCategory,
            String riskLevel,
            List<String> riskFactors,
            String summary,
            List<String> advice,
            BigDecimal riskScore
    ) {
    }
}
