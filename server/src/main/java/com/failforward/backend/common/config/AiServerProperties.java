package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai.server")
public record AiServerProperties(
        String url,
        boolean similarEnabled,
        int connectTimeout,
        int readTimeout
) {
}
