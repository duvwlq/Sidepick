package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public record AuthFeatureProperties(
        boolean localEnabled,
        boolean kakaoEnabled,
        boolean googleEnabled,
        boolean naverEnabled
) {
}
