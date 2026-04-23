package com.failforward.backend.domain.health.api;

import com.failforward.backend.common.api.ApiResponse;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.ok("Health check succeeded.", Map.of(
                "status", "UP",
                "service", "failforward-backend",
                "timestamp", LocalDateTime.now()
        ));
    }
}
