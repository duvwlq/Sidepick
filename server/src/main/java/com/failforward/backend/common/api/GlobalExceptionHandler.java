package com.failforward.backend.common.api;

import com.failforward.backend.common.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(
            NotFoundException exception,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = resolveNotFoundErrorCode(exception.getMessage());
        String message = switch (errorCode) {
            case EXPERIENCE_NOT_FOUND -> "요청한 사례를 찾을 수 없어요.";
            case REPORT_NOT_FOUND -> "요청한 분석 결과를 찾을 수 없어요.";
            default -> "요청한 정보를 찾을 수 없어요.";
        };

        logWarn(request, HttpStatus.NOT_FOUND, errorCode, exception.getMessage(), null, exception);
        return build(request, HttpStatus.NOT_FOUND, message, errorCode);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(
            BadRequestException exception,
            HttpServletRequest request
    ) {
        logWarn(request, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, exception.getMessage(), null,
                exception);
        return build(request, HttpStatus.UNPROCESSABLE_ENTITY, "입력한 내용을 다시 확인해주세요.", ErrorCode.VALIDATION_ERROR);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        String detail = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Request validation failed.");
        logWarn(request, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, detail, null, exception);
        return build(request, HttpStatus.UNPROCESSABLE_ENTITY, "입력한 내용을 다시 확인해주세요.", ErrorCode.VALIDATION_ERROR);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(
            UnauthorizedException exception,
            HttpServletRequest request
    ) {
        logWarn(request, HttpStatus.UNAUTHORIZED, ErrorCode.AUTH_REQUIRED, exception.getMessage(), null, exception);
        return build(request, HttpStatus.UNAUTHORIZED, "로그인 후 이용할 수 있어요.", ErrorCode.AUTH_REQUIRED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(
            AccessDeniedException exception,
            HttpServletRequest request
    ) {
        logWarn(request, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, exception.getMessage(), null, exception);
        return build(request, HttpStatus.FORBIDDEN, "접근 권한이 없어요.", ErrorCode.FORBIDDEN);
    }

    @ExceptionHandler(AiServerTimeoutException.class)
    public ResponseEntity<ApiResponse<Void>> handleAiTimeout(
            AiServerTimeoutException exception,
            HttpServletRequest request
    ) {
        logWarn(request, HttpStatus.GATEWAY_TIMEOUT, ErrorCode.ANALYSIS_TIMEOUT, exception.getMessage(), null,
                exception);
        return build(
                request,
                HttpStatus.GATEWAY_TIMEOUT,
                "분석 시간이 예상보다 오래 걸리고 있어요. 잠시 후 다시 확인해주세요.",
                ErrorCode.ANALYSIS_TIMEOUT
        );
    }

    @ExceptionHandler(AiServerParseException.class)
    public ResponseEntity<ApiResponse<Void>> handleAiParse(
            AiServerParseException exception,
            HttpServletRequest request
    ) {
        logError(request, HttpStatus.BAD_GATEWAY, ErrorCode.AI_PARSE_ERROR, exception.getMessage(), null, exception);
        return build(
                request,
                HttpStatus.BAD_GATEWAY,
                "분석 결과를 준비하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.",
                ErrorCode.AI_PARSE_ERROR
        );
    }

    @ExceptionHandler(AiServerException.class)
    public ResponseEntity<ApiResponse<Void>> handleAiServer(
            AiServerException exception,
            HttpServletRequest request
    ) {
        logWarn(request, HttpStatus.BAD_GATEWAY, ErrorCode.AI_UPSTREAM_ERROR, exception.getMessage(), null,
                exception);
        return build(
                request,
                HttpStatus.BAD_GATEWAY,
                "분석 요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.",
                ErrorCode.AI_UPSTREAM_ERROR
        );
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataAccess(
            DataAccessException exception,
            HttpServletRequest request
    ) {
        logError(request, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DB_WRITE_FAILED, exception.getMessage(), null,
                exception);
        return build(request, HttpStatus.INTERNAL_SERVER_ERROR, "저장 중 문제가 발생했어요. 다시 시도해주세요.", ErrorCode.DB_WRITE_FAILED);
    }

    @ExceptionHandler(MailDeliveryException.class)
    public ResponseEntity<ApiResponse<Void>> handleMailDelivery(
            MailDeliveryException exception,
            HttpServletRequest request
    ) {
        logError(request, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.MAIL_DELIVERY_FAILED, exception.getMessage(),
                null, exception);
        return build(request, HttpStatus.INTERNAL_SERVER_ERROR, "메일 전송 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.", ErrorCode.MAIL_DELIVERY_FAILED);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException exception,
            HttpServletRequest request
    ) {
        logWarn(request, HttpStatus.METHOD_NOT_ALLOWED, ErrorCode.METHOD_NOT_ALLOWED, exception.getMessage(), null,
                exception);
        return build(request, HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식이에요.", ErrorCode.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnhandled(
            Exception exception,
            HttpServletRequest request
    ) {
        logError(request, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_SERVER_ERROR, exception.getMessage(),
                null, exception);
        return build(request, HttpStatus.INTERNAL_SERVER_ERROR, "일시적인 문제가 발생했어요. 잠시 후 다시 시도해주세요.", ErrorCode.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<ApiResponse<Void>> build(
            HttpServletRequest request,
            HttpStatus status,
            String message,
            ErrorCode errorCode
    ) {
        return ResponseEntity.status(status)
                .body(ApiResponse.fail(message, errorCode, resolveTraceId(request), null));
    }

    private ErrorCode resolveNotFoundErrorCode(String detail) {
        if (detail == null) {
            return ErrorCode.RESOURCE_NOT_FOUND;
        }

        String normalized = detail.toLowerCase();
        if (normalized.contains("analysis result")) {
            return ErrorCode.REPORT_NOT_FOUND;
        }
        if (normalized.contains("experience")) {
            return ErrorCode.EXPERIENCE_NOT_FOUND;
        }
        return ErrorCode.RESOURCE_NOT_FOUND;
    }

    private void logWarn(
            HttpServletRequest request,
            HttpStatus status,
            ErrorCode errorCode,
            String detail,
            Integer externalApiStatus,
            Exception exception
    ) {
        log.warn("request_failed {}", buildLogFields(request, status, errorCode, detail, externalApiStatus), exception);
    }

    private void logError(
            HttpServletRequest request,
            HttpStatus status,
            ErrorCode errorCode,
            String detail,
            Integer externalApiStatus,
            Exception exception
    ) {
        log.error("request_failed {}", buildLogFields(request, status, errorCode, detail, externalApiStatus),
                exception);
    }

    private Map<String, Object> buildLogFields(
            HttpServletRequest request,
            HttpStatus status,
            ErrorCode errorCode,
            String detail,
            Integer externalApiStatus
    ) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("requestPath", request.getRequestURI());
        fields.put("method", request.getMethod());
        fields.put("userId", resolveUserId());
        fields.put("experienceId", resolveExperienceId(request));
        fields.put("status", status.value());
        fields.put("errorCode", errorCode.name());
        fields.put("externalApiStatus", externalApiStatus);
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

    private Long resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthenticatedUser authenticatedUser) {
            return authenticatedUser.id();
        }

        return null;
    }

    private Long resolveExperienceId(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) {
            return null;
        }

        String[] segments = uri.split("/");
        for (int index = 0; index < segments.length; index++) {
            if ("experiences".equals(segments[index]) && index + 1 < segments.length) {
                try {
                    return Long.parseLong(segments[index + 1]);
                } catch (NumberFormatException ignored) {
                    return null;
                }
            }
        }

        return null;
    }
}
