package com.failforward.backend.common.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class PublicBaseUrlResolver {

    private final ShareProperties shareProperties;

    public PublicBaseUrlResolver(ShareProperties shareProperties) {
        this.shareProperties = shareProperties;
    }

    public String resolve(HttpServletRequest request) {
        String configured = trimToNull(shareProperties.publicBaseUrl());
        if (configured != null) {
            return trimTrailingSlash(configured);
        }

        String scheme = firstNonBlank(
                request.getHeader("X-Forwarded-Proto"),
                request.getScheme()
        );
        String hostHeader = trimToNull(request.getHeader("X-Forwarded-Host"));
        String forwardedPort = trimToNull(request.getHeader("X-Forwarded-Port"));

        String host = request.getServerName();
        int port = request.getServerPort();

        if (hostHeader != null) {
            String primaryHost = hostHeader.split(",")[0].trim();
            int colonIndex = primaryHost.lastIndexOf(':');
            if (colonIndex > -1 && primaryHost.indexOf(':') == colonIndex) {
                host = primaryHost.substring(0, colonIndex).trim();
                String parsedPort = primaryHost.substring(colonIndex + 1).trim();
                if (!parsedPort.isBlank()) {
                    forwardedPort = parsedPort;
                }
            } else {
                host = primaryHost;
            }
        }

        if (forwardedPort != null) {
            try {
                port = Integer.parseInt(forwardedPort.split(",")[0].trim());
            } catch (NumberFormatException ignored) {
                // Fall back to the server port when the forwarded header is malformed.
            }
        }

        StringBuilder builder = new StringBuilder();
        builder.append(scheme)
                .append("://")
                .append(host);
        if (!isDefaultPort(scheme, port)) {
            builder.append(":").append(port);
        }
        return builder.toString();
    }

    private String firstNonBlank(String first, String second) {
        String normalizedFirst = trimToNull(first);
        return normalizedFirst != null ? normalizedFirst : second;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private boolean isDefaultPort(String scheme, int port) {
        return ("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443);
    }
}
