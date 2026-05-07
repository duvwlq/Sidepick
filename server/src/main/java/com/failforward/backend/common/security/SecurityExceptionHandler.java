package com.failforward.backend.common.security;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.common.api.ErrorCode;
import com.failforward.backend.common.api.RequestTraceFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityExceptionHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {
        log.warn("security_failure {}", buildLogFields(request, HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_REQUIRED,
                authException.getMessage()), authException);
        writeResponse(request, response, HttpStatus.UNAUTHORIZED, "로그인 후 이용할 수 있어요.", ErrorCode.AUTH_REQUIRED);
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        log.warn("security_failure {}", buildLogFields(request, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN,
                accessDeniedException.getMessage()), accessDeniedException);
        writeResponse(request, response, HttpStatus.FORBIDDEN, "접근 권한이 없어요.", ErrorCode.FORBIDDEN);
    }

    private void writeResponse(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpStatus status,
            String message,
            ErrorCode errorCode
    ) throws IOException {
        response.setStatus(status.value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
        objectMapper.writeValue(
                response.getWriter(),
                ApiResponse.fail(message, errorCode, resolveTraceId(request), null)
        );
    }

    private Map<String, Object> buildLogFields(
            HttpServletRequest request,
            HttpStatus status,
            ErrorCode errorCode,
            String detail
    ) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("requestPath", request.getRequestURI());
        fields.put("method", request.getMethod());
        fields.put("userId", null);
        fields.put("experienceId", null);
        fields.put("status", status.value());
        fields.put("errorCode", errorCode.name());
        fields.put("externalApiStatus", null);
        fields.put("elapsedTimeMs", null);
        fields.put("traceId", resolveTraceId(request));
        fields.put("timestamp", OffsetDateTime.now().toString());
        fields.put("detail", detail);
        return fields;
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestTraceFilter.TRACE_ID_ATTRIBUTE);
        return traceId instanceof String value ? value : null;
    }
}
