package com.failforward.backend.common.api;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(NotFoundException exception) {
        return Map.of(
                "success", false,
                "error", Map.of(
                        "code", "NOT_FOUND",
                        "message", exception.getMessage()
                )
        );
    }

    @ExceptionHandler({BadRequestException.class, MethodArgumentNotValidException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBadRequest(Exception exception) {
        return Map.of(
                "success", false,
                "error", Map.of(
                        "code", "INVALID_REQUEST",
                        "message", exception.getMessage()
                )
        );
    }
}
