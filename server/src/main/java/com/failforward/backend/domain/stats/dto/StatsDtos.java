package com.failforward.backend.domain.stats.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

public final class StatsDtos {

    private StatsDtos() {
    }

    public record FailurePatternItem(
            String label,
            int count,
            double percent
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record StatsExplanation(
            String chartType,
            int totalCases,
            String dataSource,
            String lastUpdated,
            boolean sufficientData,
            int minSampleSize,
            String insufficientMessage,
            StatsExplanationDebug debug
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record StatsExplanationDebug(
            String category,
            String source
    ) {
    }

    public record FailurePatternStatsResponse(
            String category,
            String labelKo,
            int total,
            boolean sufficientData,
            String summary,
            StatsExplanation explanation,
            List<FailurePatternItem> patterns
    ) {
    }

    public record FailureTimingItem(
            String bucket,
            String label,
            int order,
            int count,
            double percent
    ) {
    }

    public record FailureTimingStatsResponse(
            String category,
            int total,
            boolean sufficientData,
            String summary,
            StatsExplanation explanation,
            String peakBucket,
            List<FailureTimingItem> distribution
    ) {
    }
}
