package com.failforward.backend.common.api;

public record PageInfo(
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
}
