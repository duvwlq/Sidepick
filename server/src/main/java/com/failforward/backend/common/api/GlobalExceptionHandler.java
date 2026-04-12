package com.failforward.backend.common.api;

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
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleNotFound(NotFoundException exception) {
        return build(HttpStatus.NOT_FOUND, "Resource not found.", "NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleBadRequest(BadRequestException exception) {
        return build(HttpStatus.BAD_REQUEST, "Invalid request.", "INVALID_REQUEST", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleValidation(MethodArgumentNotValidException exception) {
        String detail = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Request validation failed.");
        return build(HttpStatus.BAD_REQUEST, "Invalid request.", "INVALID_REQUEST", detail);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleUnauthorized(UnauthorizedException exception) {
        return build(HttpStatus.UNAUTHORIZED, "Authentication failed.", "UNAUTHORIZED", exception.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleForbidden(AccessDeniedException exception) {
        return build(HttpStatus.FORBIDDEN, "Access denied.", "FORBIDDEN", exception.getMessage());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException exception
    ) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed.", "METHOD_NOT_ALLOWED", exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleUnhandled(Exception exception) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error.", "INTERNAL_SERVER_ERROR",
                exception.getMessage());
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> build(
            HttpStatus status,
            String message,
            String code,
            String detail
    ) {
        return ResponseEntity.status(status).body(
                ApiResponse.fail(message, Map.of(
                        "code", code,
                        "detail", detail
                ))
        );
    }
}
