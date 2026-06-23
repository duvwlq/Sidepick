package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.file-storage")
public record FileStorageProperties(
        String uploadDir,
        String publicPath,
        long maxProfileImageBytes,
        long maxExperienceImageBytes
) {
}
