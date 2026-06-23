package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.share")
public record ShareProperties(
        String webBaseUrl,
        String publicBaseUrl
) {
}
