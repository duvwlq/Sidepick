package com.failforward.backend.domain.admin.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.admin.dto.AdminLatencyMetricsDtos.LatencyMetricsResponse;
import com.failforward.backend.domain.admin.service.AdminLatencyMetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AdminLatencyMetricsController {

    private final AdminLatencyMetricsService adminLatencyMetricsService;

    @GetMapping("/api/admin/latency-metrics")
    public ApiResponse<LatencyMetricsResponse> getLatencyMetrics() {
        return ApiResponse.ok("Latency metrics loaded.", adminLatencyMetricsService.getLatencyMetrics());
    }
}
