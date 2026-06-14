package com.failforward.backend.domain.admin.service;

import com.failforward.backend.common.api.RequestLatencyMetricsRecorder;
import com.failforward.backend.common.security.AdminAccessPolicy;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.admin.dto.AdminLatencyMetricsDtos.EndpointLatencyResponse;
import com.failforward.backend.domain.admin.dto.AdminLatencyMetricsDtos.LatencyMetricsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminLatencyMetricsService {

    private final RequestLatencyMetricsRecorder latencyMetricsRecorder;
    private final CurrentUserProvider currentUserProvider;
    private final AdminAccessPolicy adminAccessPolicy;

    public LatencyMetricsResponse getLatencyMetrics() {
        if (!adminAccessPolicy.isAdmin(currentUserProvider.getCurrentUser())) {
            throw new AccessDeniedException("Admin access is required.");
        }

        RequestLatencyMetricsRecorder.RequestLatencyMetricsSnapshot snapshot = latencyMetricsRecorder.snapshot();
        return new LatencyMetricsResponse(
                snapshot.totalSamples(),
                snapshot.endpoints().stream()
                        .map(metric -> new EndpointLatencyResponse(
                                metric.endpoint(),
                                metric.count(),
                                metric.averageMs(),
                                metric.p50Ms(),
                                metric.p95Ms(),
                                metric.p99Ms(),
                                metric.maxMs()
                        ))
                        .toList()
        );
    }
}
