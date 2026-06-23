package com.failforward.backend.domain.stats.service;

import com.failforward.backend.common.api.InvalidRequestException;
import com.failforward.backend.common.config.StatsProperties;
import com.failforward.backend.domain.category.CategoryMapper;
import com.failforward.backend.domain.category.entity.BusinessCategory;
import com.failforward.backend.domain.category.repository.BusinessCategoryRepository;
import com.failforward.backend.domain.experience.dto.ExperienceDtos;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailurePatternItem;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailurePatternStatsResponse;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailureTimingItem;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailureTimingStatsResponse;
import com.failforward.backend.domain.stats.dto.StatsDtos.StatsExplanation;
import com.failforward.backend.domain.stats.dto.StatsDtos.StatsExplanationDebug;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StatsService {

    private static final String FAILURE_CASE_STATUS = "FAILURE";
    private static final String DATABASE_SOURCE = "database";
    private static final String DEFAULT_INSUFFICIENT_MESSAGE = "데이터를 더 수집하면 차트가 표시됩니다.";
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter OFFSET_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private static final List<TimingBucket> TIMING_BUCKETS = List.of(
            new TimingBucket("under-1m", "1개월 미만", 1, 0, 0),
            new TimingBucket("1-3m", "1~3개월", 2, 1, 3),
            new TimingBucket("3-6m", "3~6개월", 3, 4, 6),
            new TimingBucket("6-12m", "6개월~1년", 4, 7, 11),
            new TimingBucket("over-1y", "1년 이상", 5, 12, Integer.MAX_VALUE)
    );

    private final FailureExperienceRepository failureExperienceRepository;
    private final BusinessCategoryRepository businessCategoryRepository;
    private final StatsProperties statsProperties;

    public FailurePatternStatsResponse getFailurePattern(String categorySlug) {
        StatsContext context = loadStatsContext(categorySlug);
        int totalCases = context.experiences().size();
        boolean sufficientData = totalCases >= minimumSampleSize();

        Map<String, Integer> countsByLabel = new LinkedHashMap<>();
        for (FailureExperience experience : context.experiences()) {
            for (String label : extractPatternLabels(experience)) {
                countsByLabel.merge(label, 1, Integer::sum);
            }
        }

        List<FailurePatternItem> patterns = countsByLabel.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed()
                        .thenComparing(Map.Entry::getKey))
                .map(entry -> new FailurePatternItem(
                        entry.getKey(),
                        entry.getValue(),
                        roundPercent(entry.getValue(), totalCases)
                ))
                .toList();

        String summary = patterns.isEmpty()
                ? "아직 통계 데이터가 충분하지 않습니다."
                : "%s 카테고리에서는 %s 비중이 가장 높습니다."
                        .formatted(context.category().getName(), patterns.get(0).label());

        return new FailurePatternStatsResponse(
                context.slug(),
                context.category().getName(),
                totalCases,
                sufficientData,
                summary,
                buildExplanation("pattern_ratio", context.slug(), totalCases, sufficientData, context.lastUpdated()),
                patterns
        );
    }

    public FailureTimingStatsResponse getFailureTiming(String categorySlug) {
        StatsContext context = loadStatsContext(categorySlug);
        int totalCases = context.experiences().size();
        boolean sufficientData = totalCases >= minimumSampleSize();

        List<FailureTimingItem> distribution = new ArrayList<>();
        for (TimingBucket bucket : TIMING_BUCKETS) {
            int count = 0;
            for (FailureExperience experience : context.experiences()) {
                Integer durationMonths = experience.getDurationMonths();
                if (durationMonths != null && bucket.matches(durationMonths)) {
                    count++;
                }
            }
            distribution.add(new FailureTimingItem(
                    bucket.code(),
                    bucket.label(),
                    bucket.order(),
                    count,
                    roundPercent(count, totalCases)
            ));
        }

        FailureTimingItem peak = distribution.stream()
                .max(Comparator.comparingInt(FailureTimingItem::count)
                        .thenComparingInt(item -> -item.order()))
                .orElse(distribution.get(0));

        String summary = totalCases == 0
                ? "아직 실패 시점 분포를 보여주기에는 표본이 부족합니다."
                : "%s 카테고리는 %s 구간에서 실패가 가장 많이 발생했습니다."
                        .formatted(context.category().getName(), peak.label());

        return new FailureTimingStatsResponse(
                context.slug(),
                totalCases,
                sufficientData,
                summary,
                buildExplanation("timing_distribution", context.slug(), totalCases, sufficientData, context.lastUpdated()),
                peak.bucket(),
                distribution
        );
    }

    private StatsContext loadStatsContext(String categorySlug) {
        String normalized = normalizeCategory(categorySlug);
        String koreanName = CategoryMapper.toKorean(normalized)
                .orElseThrow(() -> new InvalidRequestException("Unsupported category."));
        BusinessCategory category = businessCategoryRepository.findByName(koreanName)
                .orElseThrow(() -> new InvalidRequestException("Unsupported category."));
        List<FailureExperience> experiences = failureExperienceRepository
                .findAllByIsPublicTrueAndCaseStatusAndCategoryId(FAILURE_CASE_STATUS, category.getId());
        LocalDateTime lastUpdated = experiences.stream()
                .map(FailureExperience::getUpdatedAt)
                .filter(value -> value != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        return new StatsContext(normalized, category, experiences, lastUpdated);
    }

    private List<String> extractPatternLabels(FailureExperience experience) {
        LinkedHashSet<String> labels = new LinkedHashSet<>();
        ExperienceDtos.parseStringList(experience.getDifficulties()).stream()
                .map(this::normalizeLabel)
                .filter(this::hasText)
                .forEach(labels::add);
        if (labels.isEmpty()) {
            String fallback = normalizeLabel(experience.getFailureReason());
            if (hasText(fallback)) {
                labels.add(fallback);
            }
        }
        return List.copyOf(labels);
    }

    private String normalizeCategory(String categorySlug) {
        if (categorySlug == null || categorySlug.isBlank()) {
            throw new InvalidRequestException("category parameter is required.");
        }
        return categorySlug.trim().toLowerCase();
    }

    private String normalizeLabel(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private StatsExplanation buildExplanation(
            String chartType,
            String categorySlug,
            int totalCases,
            boolean sufficientData,
            LocalDateTime lastUpdated
    ) {
        return new StatsExplanation(
                chartType,
                totalCases,
                DATABASE_SOURCE,
                formatLastUpdated(lastUpdated),
                sufficientData,
                minimumSampleSize(),
                sufficientData ? null : DEFAULT_INSUFFICIENT_MESSAGE,
                new StatsExplanationDebug(categorySlug, DATABASE_SOURCE)
        );
    }

    private String formatLastUpdated(LocalDateTime lastUpdated) {
        if (lastUpdated == null) {
            return null;
        }
        return lastUpdated.atZone(SEOUL_ZONE).format(OFFSET_FORMATTER);
    }

    private int minimumSampleSize() {
        return Math.max(1, statsProperties.minimumSufficientSample());
    }

    private double roundPercent(int count, int totalCases) {
        if (totalCases <= 0) {
            return 0.0;
        }
        double percent = ((double) count / totalCases) * 100.0;
        return Math.round(percent * 10.0) / 10.0;
    }

    private record StatsContext(
            String slug,
            BusinessCategory category,
            List<FailureExperience> experiences,
            LocalDateTime lastUpdated
    ) {
    }

    private record TimingBucket(
            String code,
            String label,
            int order,
            int minInclusive,
            int maxInclusive
    ) {
        boolean matches(int durationMonths) {
            return durationMonths >= minInclusive && durationMonths <= maxInclusive;
        }
    }
}
