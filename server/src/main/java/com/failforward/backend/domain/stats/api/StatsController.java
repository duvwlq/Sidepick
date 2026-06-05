package com.failforward.backend.domain.stats.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailurePatternStatsResponse;
import com.failforward.backend.domain.stats.dto.StatsDtos.FailureTimingStatsResponse;
import com.failforward.backend.domain.stats.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping({"/failure-pattern", "/failure-patterns"})
    public ApiResponse<FailurePatternStatsResponse> getFailurePattern(
            @RequestParam(value = "category", required = false) String category
    ) {
        return ApiResponse.ok("Failure pattern loaded.", statsService.getFailurePattern(category));
    }

    @GetMapping("/failure-timing")
    public ApiResponse<FailureTimingStatsResponse> getFailureTiming(
            @RequestParam(value = "category", required = false) String category
    ) {
        return ApiResponse.ok("Failure timing loaded.", statsService.getFailureTiming(category));
    }
}
