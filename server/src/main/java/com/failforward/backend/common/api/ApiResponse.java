package com.failforward.backend.common.api;

import java.time.OffsetDateTime;

public record ApiResponse<T>(
        boolean success,
        String message,
        String errorCode,
        String traceId,
        T data,
        String timestamp
) {
    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, null, null, data, OffsetDateTime.now().toString());
    }

    public static <T> ApiResponse<T> ok(String message, String traceId, T data) {
        return new ApiResponse<>(true, message, null, traceId, data, OffsetDateTime.now().toString());
    }

    public static <T> ApiResponse<T> fail(String message, T data) {
        return new ApiResponse<>(false, message, null, null, data, OffsetDateTime.now().toString());
    }

    public static <T> ApiResponse<T> fail(String message, String traceId, T data) {
        return new ApiResponse<>(false, message, null, traceId, data, OffsetDateTime.now().toString());
    }

    public static <T> ApiResponse<T> fail(String message, ErrorCode errorCode, T data) {
        return new ApiResponse<>(false, message, errorCode.name(), null, data, OffsetDateTime.now().toString());
    }

    public static <T> ApiResponse<T> fail(String message, ErrorCode errorCode, String traceId, T data) {
        return new ApiResponse<>(false, message, errorCode.name(), traceId, data, OffsetDateTime.now().toString());
    }
}
