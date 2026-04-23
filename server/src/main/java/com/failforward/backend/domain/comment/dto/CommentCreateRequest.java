package com.failforward.backend.domain.comment.dto;

import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.comment.entity.Comment;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record CommentCreateRequest(
        @NotBlank String content,
        Long parentId
) {
    public record CommentResponse(
            Long id,
            Long experienceId,
            Long parentId,
            UserSummary author,
            String content,
            Boolean isDeleted,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static CommentResponse from(Comment comment) {
            return new CommentResponse(
                    comment.getId(),
                    comment.getExperience().getId(),
                    comment.getParent() == null ? null : comment.getParent().getId(),
                    UserSummary.from(comment.getUser()),
                    comment.getContent(),
                    comment.getIsDeleted(),
                    comment.getCreatedAt(),
                    comment.getUpdatedAt()
            );
        }
    }
}
