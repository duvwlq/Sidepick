package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.latency-metrics")
public record LatencyMetricsProperties(
        int maxSamplesPerEndpoint,
        int maxEndpoints
) {

    public LatencyMetricsProperties {
        if (maxSamplesPerEndpoint < 10) {
            maxSamplesPerEndpoint = 10;
        }
        if (maxEndpoints < 10) {
            maxEndpoints = 10;
        }
    }
}
