package com.failforward.backend.domain.comment.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.api.NotFoundException;
import com.failforward.backend.common.security.CurrentUserProvider;
import com.failforward.backend.domain.comment.dto.CommentCreateRequest;
import com.failforward.backend.domain.comment.dto.CommentCreateRequest.CommentResponse;
import com.failforward.backend.domain.comment.entity.Comment;
import com.failforward.backend.domain.comment.repository.CommentRepository;
import com.failforward.backend.domain.experience.entity.FailureExperience;
import com.failforward.backend.domain.experience.repository.FailureExperienceRepository;
import com.failforward.backend.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final FailureExperienceRepository experienceRepository;
    private final CurrentUserProvider currentUserProvider;

    public CommentResponse create(Long experienceId, CommentCreateRequest request) {
        FailureExperience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new NotFoundException("Experience not found."));
        User user = getCurrentUser();
        Comment parent = request.parentId() == null ? null : getCommentEntity(request.parentId());

        Comment comment = commentRepository.save(Comment.create(experience, user, parent, request.content()));
        return CommentResponse.from(getCommentWithDetails(comment.getId()));
    }

    public CommentResponse createReply(Long commentId, CommentCreateRequest request) {
        Comment parent = getCommentEntity(commentId);
        return create(parent.getExperience().getId(), new CommentCreateRequest(request.content(), commentId));
    }

    public CommentResponse update(Long commentId, CommentCreateRequest request) {
        Comment comment = getCommentEntity(commentId);
        comment.updateContent(request.content());
        commentRepository.save(comment);
        return CommentResponse.from(getCommentWithDetails(comment.getId()));
    }

    public void delete(Long commentId) {
        Comment comment = getCommentEntity(commentId);
        comment.markDeleted();
        commentRepository.save(comment);
    }

    private Comment getCommentEntity(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found."));
    }

    private Comment getCommentWithDetails(Long commentId) {
        return commentRepository.findWithDetailsById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found."));
    }

    private User getCurrentUser() {
        try {
            return currentUserProvider.getCurrentUserEntity();
        } catch (Exception exception) {
            throw new BadRequestException("A user is required to create comments.");
        }
    }
}
