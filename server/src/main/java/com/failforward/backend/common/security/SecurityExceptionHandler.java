package com.failforward.backend.common.security;

import com.failforward.backend.common.api.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

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
        writeResponse(response, HttpStatus.UNAUTHORIZED, "Authentication failed.", "UNAUTHORIZED",
                authException.getMessage(), request.getRequestURI());
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        writeResponse(response, HttpStatus.FORBIDDEN, "Access denied.", "FORBIDDEN",
                accessDeniedException.getMessage(), request.getRequestURI());
    }

    private void writeResponse(
            HttpServletResponse response,
            HttpStatus status,
            String message,
            String code,
            String detail,
            String path
    ) throws IOException {
        response.setStatus(status.value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
        objectMapper.writeValue(response.getWriter(), ApiResponse.fail(message, Map.of(
                "code", code,
                "detail", detail,
                "timestamp", OffsetDateTime.now().toString(),
                "path", path
        )));
    }
}
