package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.stats")
public record StatsProperties(
        String failurePatternPath,
        String failureTimingPath,
        int minimumSufficientSample
) {
}
