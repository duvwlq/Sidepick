package com.failforward.backend.common.config;

import java.time.Duration;
import java.util.concurrent.Executor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties({
        AiServerProperties.class,
        AiAssetProperties.class,
        OAuthProperties.class,
        MailProperties.class,
        AuthFeatureProperties.class,
        AgentAProperties.class,
        StatsProperties.class,
        AnalysisCacheProperties.class,
        ChatbotProperties.class,
        LatencyMetricsProperties.class,
        FileStorageProperties.class,
        ShareProperties.class
})
public class AiClientConfig {

    @Bean
    public RestTemplate aiRestTemplate(RestTemplateBuilder builder, AiServerProperties properties) {
        return builder
                .setConnectTimeout(Duration.ofMillis(properties.connectTimeout()))
                .setReadTimeout(Duration.ofMillis(properties.readTimeout()))
                .build();
    }

    @Bean
    public RestTemplate oauthRestTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Bean(name = "analysisTaskExecutor")
    @Profile("test")
    public TaskExecutor analysisTaskExecutorForTest() {
        return new SyncTaskExecutor();
    }

    @Bean(name = "analysisTaskExecutor")
    @Profile("!test")
    public Executor analysisTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("analysis-");
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.initialize();
        return executor;
    }
}
