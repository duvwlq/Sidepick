package com.failforward.backend.domain.bookmark.dto;

public final class BookmarkDtos {

    private BookmarkDtos() {
    }

    public record BookmarkStatusResponse(
            Long experienceId,
            boolean bookmarked
    ) {
    }
}
