package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(
        boolean enabled,
        String fromAddress,
        String fromName
) {
    public boolean isConfigured() {
        return enabled
                && fromAddress != null
                && !fromAddress.isBlank()
                && fromName != null
                && !fromName.isBlank();
    }
}
