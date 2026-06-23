package com.failforward.backend.common.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

@Component
public class RequestLatencyMetricsInterceptor implements HandlerInterceptor {

    public static final String REQUEST_START_NANO_ATTRIBUTE = "requestLatencyStartNano";
    public static final String ELAPSED_TIME_MS_ATTRIBUTE = "elapsedTimeMs";

    private final RequestLatencyMetricsRecorder latencyMetricsRecorder;

    public RequestLatencyMetricsInterceptor(RequestLatencyMetricsRecorder latencyMetricsRecorder) {
        this.latencyMetricsRecorder = latencyMetricsRecorder;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(REQUEST_START_NANO_ATTRIBUTE, System.nanoTime());
        return true;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex
    ) {
        Object startTime = request.getAttribute(REQUEST_START_NANO_ATTRIBUTE);
        if (!(startTime instanceof Long startedAtNano)) {
            return;
        }

        long elapsedTimeMs = (System.nanoTime() - startedAtNano) / 1_000_000L;
        request.setAttribute(ELAPSED_TIME_MS_ATTRIBUTE, elapsedTimeMs);

        latencyMetricsRecorder.record(resolveEndpointKey(request, handler), elapsedTimeMs);
    }

    private String resolveEndpointKey(HttpServletRequest request, Object handler) {
        String method = request.getMethod();
        Object bestMatchingPattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);

        if (bestMatchingPattern instanceof String pattern && !pattern.isBlank()) {
            return method + " " + pattern;
        }

        if (handler instanceof HandlerMethod) {
            return method + " " + request.getRequestURI();
        }

        return method + " " + request.getRequestURI();
    }
}
