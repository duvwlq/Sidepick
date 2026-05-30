package com.failforward.backend.domain.bookmark.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.bookmark.dto.BookmarkDtos.BookmarkStatusResponse;
import com.failforward.backend.domain.bookmark.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping("/api/experiences/{experienceId}/bookmarks")
    public ApiResponse<BookmarkStatusResponse> bookmark(@PathVariable Long experienceId) {
        return ApiResponse.ok("Bookmark saved.", bookmarkService.bookmark(experienceId));
    }

    @DeleteMapping("/api/experiences/{experienceId}/bookmarks")
    public ApiResponse<BookmarkStatusResponse> unbookmark(@PathVariable Long experienceId) {
        return ApiResponse.ok("Bookmark removed.", bookmarkService.unbookmark(experienceId));
    }

    @GetMapping("/api/experiences/{experienceId}/bookmarks/me")
    public ApiResponse<BookmarkStatusResponse> getBookmarkStatus(@PathVariable Long experienceId) {
        return ApiResponse.ok("Bookmark status loaded.", bookmarkService.getStatus(experienceId));
    }
}
