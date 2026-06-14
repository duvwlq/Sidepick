package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.analysis-cache")
public record AnalysisCacheProperties(
        int ttlHours,
        int maxEntries
) {
}
