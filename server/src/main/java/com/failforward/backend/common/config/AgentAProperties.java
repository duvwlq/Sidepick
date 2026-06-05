package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.agent-a")
public record AgentAProperties(
        int timeoutSec,
        int rateLimitPerMin
) {
}
