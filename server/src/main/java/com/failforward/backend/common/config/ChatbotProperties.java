package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.chatbot")
public record ChatbotProperties(
        int rateLimitPerMin,
        int maxMessageLength,
        int minimumGuideMessageLength,
        int queueCapacity,
        int dailyTokenLimit
) {
}
