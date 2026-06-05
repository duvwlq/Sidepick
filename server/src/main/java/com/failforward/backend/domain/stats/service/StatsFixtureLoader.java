package com.failforward.backend.domain.stats.service;

import com.failforward.backend.common.config.StatsProperties;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailurePatternItem;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailurePatternStatsResponse;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailureTimingItem;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailureTimingStatsResponse;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StatsFixtureLoader {

    private static final int MINIMUM_SUFFICIENT_SAMPLE = 5;

    private final ObjectMapper objectMapper;
    private final StatsProperties statsProperties;

    public FailurePatternStatsResponse loadFailurePattern(String categorySlug) {
        FailurePatternStatsResponse fileResponse = loadFailurePatternFromFile(categorySlug);
        if (fileResponse != null) {
            return fileResponse;
        }

        FailurePatternFixture fixture = FAILURE_PATTERNS.get(categorySlug);
        if (fixture == null) {
            return null;
        }

        boolean sufficientData = fixture.total() >= MINIMUM_SUFFICIENT_SAMPLE;
        FailurePatternItem primary = fixture.patterns().isEmpty() ? null : fixture.patterns().get(0);
        String explanation = sufficientData && primary != null
                ? "%s 카테고리의 %.1f%%가 %s을 주요 실패 원인으로 나타내고 있어요."
                        .formatted(fixture.labelKo(), primary.percent(), primary.label())
                : "아직 통계 데이터를 더 수집하고 있어요. 사례가 쌓이면 차트가 자동으로 채워집니다.";

        return new FailurePatternStatsResponse(
                categorySlug,
                fixture.labelKo(),
                fixture.total(),
                sufficientData,
                explanation,
                fixture.patterns()
        );
    }

    public FailureTimingStatsResponse loadFailureTiming(String categorySlug) {
        FailureTimingStatsResponse fileResponse = loadFailureTimingFromFile(categorySlug);
        if (fileResponse != null) {
            return fileResponse;
        }

        FailureTimingFixture fixture = FAILURE_TIMINGS.get(categorySlug);
        if (fixture == null) {
            return null;
        }

        boolean sufficientData = fixture.total() >= MINIMUM_SUFFICIENT_SAMPLE;
        String explanation = sufficientData
                ? "%s 카테고리는 %s 구간에서 실패 비중이 가장 높게 나타났어요."
                        .formatted(resolveLabel(categorySlug), resolvePeakLabel(fixture.distribution(), fixture.peakBucket()))
                : "아직 실패 시점 분포를 보여주기에는 표본이 부족해요.";

        return new FailureTimingStatsResponse(
                categorySlug,
                fixture.total(),
                sufficientData,
                explanation,
                fixture.peakBucket(),
                fixture.distribution()
        );
    }

    private FailurePatternStatsResponse loadFailurePatternFromFile(String categorySlug) {
        FailurePatternJsonRoot root = readFailurePatternRoot();
        if (root == null || root.categories() == null) {
            return null;
        }

        FailurePatternJsonCategory category = root.categories().get(categorySlug);
        if (category == null) {
            return null;
        }

        List<FailurePatternItem> patterns = Optional.ofNullable(category.patterns()).orElse(List.of()).stream()
                .map(item -> new FailurePatternItem(item.label(), item.count(), item.percent()))
                .toList();
        boolean sufficientData = category.total() >= statsProperties.minimumSufficientSample();
        FailurePatternItem primary = patterns.isEmpty() ? null : patterns.get(0);
        String explanation = sufficientData && primary != null
                ? "%s 카테고리의 %.1f%%가 %s을 주요 실패 원인으로 나타내고 있어요."
                        .formatted(category.labelKo(), primary.percent(), primary.label())
                : "아직 통계 데이터를 더 수집하고 있어요. 사례가 쌓이면 차트가 자동으로 채워집니다.";

        return new FailurePatternStatsResponse(
                categorySlug,
                category.labelKo(),
                category.total(),
                sufficientData,
                explanation,
                patterns
        );
    }

    private FailureTimingStatsResponse loadFailureTimingFromFile(String categorySlug) {
        FailureTimingJsonRoot root = readFailureTimingRoot();
        if (root == null || root.categories() == null) {
            return null;
        }

        FailureTimingJsonCategory category = root.categories().get(categorySlug);
        if (category == null) {
            return null;
        }

        Map<String, Integer> orderMap = Optional.ofNullable(root.buckets()).orElse(List.of()).stream()
                .collect(Collectors.toMap(FailureTimingBucketDefinition::bucket, FailureTimingBucketDefinition::order, (left, right) -> left));
        List<FailureTimingItem> distribution = Optional.ofNullable(category.distribution()).orElse(List.of()).stream()
                .map(item -> new FailureTimingItem(
                        item.bucket(),
                        item.label(),
                        orderMap.getOrDefault(item.bucket(), 0),
                        item.count(),
                        item.percent()
                ))
                .toList();

        boolean sufficientData = category.total() >= statsProperties.minimumSufficientSample();
        String explanation = sufficientData
                ? "%s 카테고리는 %s 구간에서 실패 비중이 가장 높게 나타났어요."
                        .formatted(resolveLabel(categorySlug), resolvePeakLabel(distribution, category.peakBucket()))
                : "아직 실패 시점 분포를 보여주기에는 표본이 부족해요.";

        return new FailureTimingStatsResponse(
                categorySlug,
                category.total(),
                sufficientData,
                explanation,
                category.peakBucket(),
                distribution
        );
    }

    private FailurePatternJsonRoot readFailurePatternRoot() {
        Path path = resolvePath(statsProperties.failurePatternPath());
        if (path == null || !Files.exists(path)) {
            return null;
        }
        try {
            return objectMapper.readValue(path.toFile(), FailurePatternJsonRoot.class);
        } catch (IOException exception) {
            return null;
        }
    }

    private FailureTimingJsonRoot readFailureTimingRoot() {
        Path path = resolvePath(statsProperties.failureTimingPath());
        if (path == null || !Files.exists(path)) {
            return null;
        }
        try {
            return objectMapper.readValue(path.toFile(), FailureTimingJsonRoot.class);
        } catch (IOException exception) {
            return null;
        }
    }

    private Path resolvePath(String configuredPath) {
        if (configuredPath == null || configuredPath.isBlank()) {
            return null;
        }
        return Path.of(configuredPath).normalize();
    }

    private String resolveLabel(String categorySlug) {
        FailurePatternFixture fixture = FAILURE_PATTERNS.get(categorySlug);
        if (fixture != null) {
            return fixture.labelKo();
        }

        FailurePatternJsonRoot root = readFailurePatternRoot();
        if (root == null || root.categories() == null) {
            return categorySlug;
        }
        FailurePatternJsonCategory category = root.categories().get(categorySlug);
        return category == null ? categorySlug : category.labelKo();
    }

    private String resolvePeakLabel(List<FailureTimingItem> distribution, String peakBucket) {
        return distribution.stream()
                .filter(item -> item.bucket().equals(peakBucket))
                .map(FailureTimingItem::label)
                .findFirst()
                .orElse(peakBucket);
    }

    private record FailurePatternFixture(
            String labelKo,
            int total,
            List<FailurePatternItem> patterns
    ) {
    }

    private record FailureTimingFixture(
            int total,
            String peakBucket,
            List<FailureTimingItem> distribution
    ) {
    }

    private static final Map<String, FailurePatternFixture> FAILURE_PATTERNS = Map.of(
            "online-commerce",
            new FailurePatternFixture(
                    "온라인 판매·이커머스",
                    12,
                    List.of(
                            new FailurePatternItem("마케팅 부족", 6, 50.0),
                            new FailurePatternItem("수익 구조 이해 부족", 4, 33.3),
                            new FailurePatternItem("재고 과잉", 3, 25.0),
                            new FailurePatternItem("시장 조사 부족", 3, 25.0),
                            new FailurePatternItem("운영 자동화 미흡", 2, 16.7)
                    )
            ),
            "content-sns",
            new FailurePatternFixture(
                    "콘텐츠·SNS 기반",
                    23,
                    List.of(
                            new FailurePatternItem("수익화 전략 부재", 9, 39.1),
                            new FailurePatternItem("꾸준함 부족", 7, 30.4),
                            new FailurePatternItem("차별화 부족", 6, 26.1),
                            new FailurePatternItem("채널 운영 피로", 5, 21.7),
                            new FailurePatternItem("타깃 설정 미흡", 4, 17.4)
                    )
            ),
            "digital-products",
            new FailurePatternFixture(
                    "디지털 상품·지식 판매",
                    1,
                    List.of(new FailurePatternItem("시장 검증 부족", 1, 100.0))
            ),
            "platform-labor",
            new FailurePatternFixture(
                    "플랫폼 기반 노동형",
                    25,
                    List.of(
                            new FailurePatternItem("낮은 단가", 11, 44.0),
                            new FailurePatternItem("지속 가능성 부족", 9, 36.0),
                            new FailurePatternItem("체력 소진", 7, 28.0),
                            new FailurePatternItem("플랫폼 의존도 과다", 6, 24.0),
                            new FailurePatternItem("시간 관리 실패", 4, 16.0)
                    )
            ),
            "talent-freelance",
            new FailurePatternFixture(
                    "재능 판매·프리랜서",
                    9,
                    List.of(
                            new FailurePatternItem("고객 확보 어려움", 4, 44.4),
                            new FailurePatternItem("포트폴리오 부족", 3, 33.3),
                            new FailurePatternItem("가격 책정 실패", 3, 33.3),
                            new FailurePatternItem("재계약 저조", 2, 22.2),
                            new FailurePatternItem("업무 범위 관리 실패", 2, 22.2)
                    )
            ),
            "investment",
            new FailurePatternFixture(
                    "투자·재테크",
                    25,
                    List.of(
                            new FailurePatternItem("리스크 관리 부족", 10, 40.0),
                            new FailurePatternItem("조급한 매매", 8, 32.0),
                            new FailurePatternItem("정보 과신", 6, 24.0),
                            new FailurePatternItem("분산 투자 부족", 5, 20.0),
                            new FailurePatternItem("원칙 없는 대응", 4, 16.0)
                    )
            ),
            "offline-sidejob",
            new FailurePatternFixture(
                    "오프라인 기반 부업",
                    4,
                    List.of(
                            new FailurePatternItem("고정비 부담", 2, 50.0),
                            new FailurePatternItem("동선 비효율", 2, 50.0),
                            new FailurePatternItem("수요 예측 실패", 1, 25.0)
                    )
            ),
            "etc",
            new FailurePatternFixture(
                    "기타",
                    1,
                    List.of(new FailurePatternItem("표본 부족", 1, 100.0))
            )
    );

    private static final List<FailureTimingItem> DEFAULT_BUCKETS = List.of(
            new FailureTimingItem("under-1m", "1개월 미만", 1, 0, 0.0),
            new FailureTimingItem("1-3m", "1~3개월", 2, 0, 0.0),
            new FailureTimingItem("3-6m", "3~6개월", 3, 0, 0.0),
            new FailureTimingItem("6-12m", "6개월~1년", 4, 0, 0.0),
            new FailureTimingItem("over-1y", "1년 이상", 5, 0, 0.0)
    );

    private static final Map<String, FailureTimingFixture> FAILURE_TIMINGS = Map.of(
            "online-commerce",
            new FailureTimingFixture(
                    12,
                    "over-1y",
                    List.of(
                            new FailureTimingItem("under-1m", "1개월 미만", 1, 1, 8.3),
                            new FailureTimingItem("1-3m", "1~3개월", 2, 2, 16.7),
                            new FailureTimingItem("3-6m", "3~6개월", 3, 2, 16.7),
                            new FailureTimingItem("6-12m", "6개월~1년", 4, 3, 25.0),
                            new FailureTimingItem("over-1y", "1년 이상", 5, 4, 33.3)
                    )
            ),
            "content-sns",
            new FailureTimingFixture(
                    23,
                    "3-6m",
                    List.of(
                            new FailureTimingItem("under-1m", "1개월 미만", 1, 2, 8.7),
                            new FailureTimingItem("1-3m", "1~3개월", 2, 6, 26.1),
                            new FailureTimingItem("3-6m", "3~6개월", 3, 7, 30.4),
                            new FailureTimingItem("6-12m", "6개월~1년", 4, 5, 21.7),
                            new FailureTimingItem("over-1y", "1년 이상", 5, 3, 13.0)
                    )
            ),
            "digital-products",
            new FailureTimingFixture(
                    1,
                    "1-3m",
                    List.of(
                            new FailureTimingItem("under-1m", "1개월 미만", 1, 0, 0.0),
                            new FailureTimingItem("1-3m", "1~3개월", 2, 1, 100.0),
                            new FailureTimingItem("3-6m", "3~6개월", 3, 0, 0.0),
                            new FailureTimingItem("6-12m", "6개월~1년", 4, 0, 0.0),
                            new FailureTimingItem("over-1y", "1년 이상", 5, 0, 0.0)
                    )
            ),
            "platform-labor",
            new FailureTimingFixture(
                    25,
                    "1-3m",
                    List.of(
                            new FailureTimingItem("under-1m", "1개월 미만", 1, 5, 20.0),
                            new FailureTimingItem("1-3m", "1~3개월", 2, 8, 32.0),
                            new FailureTimingItem("3-6m", "3~6개월", 3, 6, 24.0),
                            new FailureTimingItem("6-12m", "6개월~1년", 4, 4, 16.0),
                            new FailureTimingItem("over-1y", "1년 이상", 5, 2, 8.0)
                    )
            ),
            "talent-freelance",
            new FailureTimingFixture(
                    9,
                    "3-6m",
                    List.of(
                            new FailureTimingItem("under-1m", "1개월 미만", 1, 1, 11.1),
                            new FailureTimingItem("1-3m", "1~3개월", 2, 2, 22.2),
                            new FailureTimingItem("3-6m", "3~6개월", 3, 3, 33.3),
                            new FailureTimingItem("6-12m", "6개월~1년", 4, 2, 22.2),
                            new FailureTimingItem("over-1y", "1년 이상", 5, 1, 11.1)
                    )
            ),
            "investment",
            new FailureTimingFixture(
                    25,
                    "under-1m",
                    List.of(
                            new FailureTimingItem("under-1m", "1개월 미만", 1, 9, 36.0),
                            new FailureTimingItem("1-3m", "1~3개월", 2, 7, 28.0),
                            new FailureTimingItem("3-6m", "3~6개월", 3, 4, 16.0),
                            new FailureTimingItem("6-12m", "6개월~1년", 4, 3, 12.0),
                            new FailureTimingItem("over-1y", "1년 이상", 5, 2, 8.0)
                    )
            ),
            "offline-sidejob",
            new FailureTimingFixture(
                    4,
                    "1-3m",
                    List.of(
                            new FailureTimingItem("under-1m", "1개월 미만", 1, 1, 25.0),
                            new FailureTimingItem("1-3m", "1~3개월", 2, 2, 50.0),
                            new FailureTimingItem("3-6m", "3~6개월", 3, 1, 25.0),
                            new FailureTimingItem("6-12m", "6개월~1년", 4, 0, 0.0),
                            new FailureTimingItem("over-1y", "1년 이상", 5, 0, 0.0)
                    )
            ),
            "etc",
            new FailureTimingFixture(1, "under-1m", DEFAULT_BUCKETS)
    );

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FailurePatternJsonRoot(
            Map<String, FailurePatternJsonCategory> categories
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FailurePatternJsonCategory(
            @JsonProperty("label_ko")
            String labelKo,
            int total,
            List<FailurePatternJsonItem> patterns
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FailurePatternJsonItem(
            String label,
            int count,
            double percent
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FailureTimingJsonRoot(
            List<FailureTimingBucketDefinition> buckets,
            Map<String, FailureTimingJsonCategory> categories
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FailureTimingBucketDefinition(
            String bucket,
            int order
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FailureTimingJsonCategory(
            int total,
            @JsonProperty("peak_bucket")
            String peakBucket,
            List<FailureTimingJsonItem> distribution
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FailureTimingJsonItem(
            String bucket,
            String label,
            int count,
            double percent
    ) {
    }
}
