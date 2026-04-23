package com.failforward.backend.domain.comment.api;

import com.failforward.backend.common.api.ApiResponse;
import com.failforward.backend.domain.comment.dto.CommentCreateRequest;
import com.failforward.backend.domain.comment.dto.CommentCreateRequest.CommentResponse;
import com.failforward.backend.domain.comment.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/api/experiences/{experienceId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CommentResponse> createComment(
            @PathVariable Long experienceId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        return ApiResponse.ok("Comment created", commentService.create(experienceId, request));
    }

    @PostMapping("/api/comments/{commentId}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CommentResponse> createReply(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        return ApiResponse.ok("Reply created", commentService.createReply(commentId, request));
    }

    @PatchMapping("/api/comments/{commentId}")
    public ApiResponse<CommentResponse> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        return ApiResponse.ok("Comment updated", commentService.update(commentId, request));
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ApiResponse<Void> deleteComment(@PathVariable Long commentId) {
        commentService.delete(commentId);
        return ApiResponse.ok("Comment deleted", null);
    }
}
