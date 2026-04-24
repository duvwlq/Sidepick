package com.failforward.backend.common.api;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleNotFound(
            NotFoundException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.NOT_FOUND, "Resource not found.", "NOT_FOUND", exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleBadRequest(
            BadRequestException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "Invalid request.", "INVALID_REQUEST", exception.getMessage(),
                request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        String detail = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Request validation failed.");
        return build(HttpStatus.BAD_REQUEST, "Invalid request.", "INVALID_REQUEST", detail, request.getRequestURI());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleUnauthorized(
            UnauthorizedException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.UNAUTHORIZED, "Authentication failed.", "UNAUTHORIZED", exception.getMessage(),
                request.getRequestURI());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleForbidden(
            AccessDeniedException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.FORBIDDEN, "Access denied.", "FORBIDDEN", exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(AiServerTimeoutException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleAiTimeout(
            AiServerTimeoutException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.GATEWAY_TIMEOUT, "AI request timed out.", "AI_TIMEOUT", exception.getMessage(),
                request.getRequestURI());
    }

    @ExceptionHandler(AiServerException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleAiServer(
            AiServerException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_GATEWAY, "AI server request failed.", "AI_SERVER_ERROR", exception.getMessage(),
                request.getRequestURI());
    }

    @ExceptionHandler(MailDeliveryException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleMailDelivery(
            MailDeliveryException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Mail delivery failed.", "MAIL_DELIVERY_FAILED",
                exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed.", "METHOD_NOT_ALLOWED",
                exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleUnhandled(
            Exception exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error.", "INTERNAL_SERVER_ERROR",
                exception.getMessage(), request.getRequestURI());
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> build(
            HttpStatus status,
            String message,
            String code,
            String detail,
            String path
    ) {
        return ResponseEntity.status(status).body(
                ApiResponse.fail(message, Map.of(
                        "code", code,
                        "detail", detail,
                        "timestamp", OffsetDateTime.now().toString(),
                        "path", path
                ))
        );
    }
}
