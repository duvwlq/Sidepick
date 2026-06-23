package com.failforward.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai-assets")
public record AiAssetProperties(
        String successAnalysisDraftsPath
) {
}
