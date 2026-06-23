package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.oauth")
public record OAuthProperties(
        Provider kakao,
        Provider google,
        Provider naver
) {
    public record Provider(
            String clientId,
            String clientSecret
    ) {
        public boolean isConfigured() {
            return clientId != null && !clientId.isBlank();
        }
    }
}
