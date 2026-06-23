package com.failforward.backend.common.config;

import com.failforward.backend.common.api.RequestLatencyMetricsInterceptor;
import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final RequestLatencyMetricsInterceptor requestLatencyMetricsInterceptor;
    private final FileStorageProperties fileStorageProperties;

    public WebMvcConfig(
            RequestLatencyMetricsInterceptor requestLatencyMetricsInterceptor,
            FileStorageProperties fileStorageProperties
    ) {
        this.requestLatencyMetricsInterceptor = requestLatencyMetricsInterceptor;
        this.fileStorageProperties = fileStorageProperties;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(requestLatencyMetricsInterceptor);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String publicPath = normalizePublicPath(fileStorageProperties.publicPath());
        Path uploadRoot = Path.of(fileStorageProperties.uploadDir()).toAbsolutePath().normalize();
        registry.addResourceHandler(publicPath + "/**")
                .addResourceLocations(uploadRoot.toUri().toString());
    }

    private String normalizePublicPath(String publicPath) {
        if (publicPath == null || publicPath.isBlank()) {
            return "/uploads";
        }
        return publicPath.startsWith("/") ? publicPath : "/" + publicPath;
    }
}
