package com.failforward.backend.domain.stats.service;

import com.failforward.backend.common.api.InvalidRequestException;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailurePatternStatsResponse;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailureTimingStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final StatsFixtureLoader statsFixtureLoader;

    public FailurePatternStatsResponse getFailurePattern(String categorySlug) {
        String normalized = normalizeCategory(categorySlug);
        FailurePatternStatsResponse response = statsFixtureLoader.loadFailurePattern(normalized);
        if (response == null) {
            throw new InvalidRequestException("지원하지 않는 카테고리입니다.");
        }
        return response;
    }

    public FailureTimingStatsResponse getFailureTiming(String categorySlug) {
        String normalized = normalizeCategory(categorySlug);
        FailureTimingStatsResponse response = statsFixtureLoader.loadFailureTiming(normalized);
        if (response == null) {
            throw new InvalidRequestException("지원하지 않는 카테고리입니다.");
        }
        return response;
    }

    private String normalizeCategory(String categorySlug) {
        if (categorySlug == null || categorySlug.isBlank()) {
            throw new InvalidRequestException("category 파라미터는 필수입니다.");
        }
        return categorySlug.trim().toLowerCase();
    }
}
