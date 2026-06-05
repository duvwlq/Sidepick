package com.failforward.backend.domain.stats.dto;

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

    public record FailurePatternStatsResponse(
            String category,
            String labelKo,
            int total,
            boolean sufficientData,
            String explanation,
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
            String explanation,
            String peakBucket,
            List<FailureTimingItem> distribution
    ) {
    }
}
