package com.failforward.backend.domain.admin.dto;

import java.util.List;

public final class AdminLatencyMetricsDtos {

    private AdminLatencyMetricsDtos() {
    }

    public record LatencyMetricsResponse(
            long totalSamples,
            List<EndpointLatencyResponse> endpoints
    ) {
    }

    public record EndpointLatencyResponse(
            String endpoint,
            long count,
            long averageMs,
            long p50Ms,
            long p95Ms,
            long p99Ms,
            long maxMs
    ) {
    }
}
